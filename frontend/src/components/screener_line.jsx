import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import moment from 'moment';

// ScreenerLine component creates a line chart using D3.js
const ScreenerLine = ({ data, colors }) => {
    // Refs for accessing the SVG element and tooltip
    const svgRef = useRef();
    const tooltipRef = useRef();
    const createTradingSessionWindows = (rawData) => {
        // Sort data by time first
        const sortedData = [...rawData].sort((a, b) => moment(a.time).diff(moment(b.time)));
        
        const sessions = [];
        let currentSession = [];
        let previousTime = null;
        
        sortedData.forEach(dataPoint => {
            const time = moment(dataPoint.time).utc();
            const isWeekday = time.day() !== 0 && time.day() !== 6;
            const hour = time.hour() + (time.minute() / 60);
            const isTradeHours = hour >= 14.5 && hour < 21;
            
            if (isWeekday && isTradeHours) {
                // If this is a new session (more than 1 hour gap or first entry)
                if (!previousTime || time.diff(previousTime, 'hours') > 1) {
                    if (currentSession.length > 0) {
                        sessions.push(currentSession);
                    }
                    currentSession = [dataPoint];
                } else {
                    currentSession.push(dataPoint);
                }
                previousTime = time;
            }
        });
        
        // Push the last session if it exists
        if (currentSession.length > 0) {
            sessions.push(currentSession);
        }
        
        // Add session metadata
        const sessionsWithMetadata = sessions.map((session, index) => {
            const startTime = moment(session[0].time);
            const endTime = moment(session[session.length - 1].time);
            return {
                sessionId: index + 1,
                startTime: startTime.format('YYYY-MM-DD HH:mm:ss'),
                endTime: endTime.format('YYYY-MM-DD HH:mm:ss'),
                duration: endTime.diff(startTime, 'hours', true).toFixed(2),
                dataPoints: session.length,
                data: session
            };
        });

        console.log('Trading Sessions:', sessionsWithMetadata);
        return sessionsWithMetadata;
    };

    useEffect(() => {
        // Clear any existing SVG content
        // Add this at the start of useEffect
        const tradingSessions = createTradingSessionWindows(data);
        console.log('Trading Session Data:', tradingSessions);

        d3.select(svgRef.current).selectAll("*").remove();
        
        // Configure chart dimensions and margins
        const margin = { top: 20, right: 30, bottom: 30, left: 60 };
        const svg = d3.select(svgRef.current);
        const width = +svgRef.current.clientWidth - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const sessionDomains = tradingSessions.flatMap(session => [
            moment(session.startTime).local(),
            moment(session.endTime).local()
        ]);

        const segmentWidth = innerWidth / tradingSessions.length;
        const sessionRanges = tradingSessions.flatMap((_, index) => [
            index * segmentWidth,
            (index + 1) * segmentWidth
        ]);

        // Create X scale (time) and Y scale (price)
        // Convert UTC timestamps to local time for proper display
        const xScale = d3.scaleLinear()
            .domain(sessionDomains)
            .range(sessionRanges);
        const yScale = d3.scaleLinear()
            .domain([
                d3.min(data, d => d.price) * 0.95,
                d3.max(data, d => d.price) * 1.05
            ])
            .range([innerHeight, 0]);

        // Create tooltip element for displaying data on hover
        const tooltip = d3.select(tooltipRef.current)
            .style("opacity", 0);

        // Define the line generator function that creates the SVG path
        const line = d3.line()
            .x(d => {
                return xScale(moment(d.time).local());
            })
            .y(d => yScale(d.price))

        // Create the chart group and transform it
        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Add an area
        const area = d3.area()
            .x(d => {
                return xScale(moment(d.time).local());
            })
            .y0(innerHeight)
            .y1(d => yScale(d.price))

        g.append('path')
            .attr('fill', colors.redAccent[600])
            .attr('opacity', 0.6)
            .attr('d', area(data))
        
        // Add the line path
        g.append("path")
            .datum(data)
            .attr("fill", 'none')
            .attr("stroke", colors.redAccent[500])
            .attr("stroke-width", 2)
            .attr("d", line);

        // Create bisector for finding closest data point to mouse position
        const bisect = d3.bisector(d => {
            return moment(d.time).local();
        }).left;

        // Add invisible rectangle to capture mouse events
        g.append('rect')
            .attr('width', innerWidth)
            .attr('height', innerHeight)
            .style('fill', 'none')
            .style('pointer-events', 'all')
            .on('mousemove', (event) => {
                // Handle mouse movement to show tooltip with price and time
                const mouseX = d3.pointer(event)[0];
                const x0 = xScale.invert(mouseX);
                const i = bisect(data, x0);
                const d = data[i];
                if (d) {
                    tooltip.transition().duration(200).style('opacity', 0.9);
                    tooltip.html(`Date: ${moment(d.time).format("YYYY-MM-DD hh:mm:ss A")}<br>Price: ${d3.format("$,.2f")(d.price)}`);
                }
                tooltip.style("left", `${d3.pointer(event)[0] + 180}px`)
                .style("top", `${d3.pointer(event)[1] + 210}px`);
            })
            .on('mouseout', () => {
                tooltip.transition().duration(500).style('opacity', 0);
            });
        

        const uniqueDays = [...new Set(data.map(d => moment(d.time).format('YYYY-MM-DD')))];
        const midValuePerDay = uniqueDays.map(day => {
            const dayValues = data.filter(d => moment(d.time).format('YYYY-MM-DD') === day);
            const midIndex = Math.floor(dayValues.length / 2);
            return dayValues[midIndex];
        });

        const tickValues = midValuePerDay.length > 10
            ? midValuePerDay.filter((_, i) => i % Math.ceil(midValuePerDay.length / 10) === 0)
            : midValuePerDay;

        // Add axes
        const xAxis = d3.axisBottom(xScale)
            .tickFormat(d => moment(d).format('YYYY-MM-DD'))
            .tickValues(tickValues.map(d => moment(d.time).local()));

        const yAxis = d3.axisLeft(yScale);
        g.append("g")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(xAxis);
        g.append("g")
            .call(yAxis);

    }, [data, colors]);// Re-render chart when data or colors change

    return (
        <>
            {/* Tooltip container for displaying data points */}
            <div ref={tooltipRef} className="tooltip"
                    style={{
                        position: 'absolute',
                        pointerEvents: 'none',
                        background: 'white',
                        border: '1px solid black',
                        borderRadius: '5px',
                        padding: '5px',
                        opacity: 0,
                        color: 'black'
                    }}>
            </div>
            {/* SVG container for the line chart */}
            <svg ref={svgRef} style={{ height: 400, width: '100%' }}>
            </svg>
        </>
    );
};

// PropTypes validation for component props
//ScreenerLine.propTypes = {
//    data: PropTypes.arrayOf(PropTypes.shape({
//        time: PropTypes.string.isRequired,
//        price: PropTypes.number.isRequired
//    })).isRequired,
//};

export default ScreenerLine;