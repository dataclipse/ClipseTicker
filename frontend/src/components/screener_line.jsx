import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import PropTypes from 'prop-types';

// ScreenerLine component creates a line chart using D3.js
const ScreenerLine = ({ data, colors = { line: '#2196f3', hover: '#666' } }) => {
    // Refs for accessing the SVG element and tooltip
    const svgRef = useRef();
    const tooltipRef = useRef();

    useEffect(() => {
        // Clear any existing SVG content
        d3.select(svgRef.current).selectAll("*").remove();

        // Configure chart dimensions and margins
        const margin = { top: 20, right: 30, bottom: 30, left: 60 };
        const svg = d3.select(svgRef.current);
        const width = +svgRef.current.clientWidth - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        // Create X scale (time) and Y scale (price)
        // Convert UTC timestamps to local time for proper display
        const xScale = d3.scaleTime()
            .domain(d3.extent(data, d => {
                const utcDate = new Date(d.time);
                return new Date(utcDate.getTime() + utcDate.getTimezoneOffset() * 60000);
            }))
            .range([0, innerWidth]);
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
                const utcDate = new Date(d.time);
                return xScale(new Date(utcDate.getTime() + utcDate.getTimezoneOffset() * 60000));
            })
            .y(d => yScale(d.price));

        // Create the chart group and transform it
        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Add the line path
        g.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "#2196f3")
            .attr("stroke-width", 1.5)
            .attr("d", line);

        // Create bisector for finding closest data point to mouse position
        const bisect = d3.bisector(d => {
            const utcDate = new Date(d.time);
            return utcDate.getTime() + utcDate.getTimezoneOffset() * 60000;
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
                    const utcDate = new Date(d.time);
                    tooltip.html(`Date: ${d3.timeFormat("%Y-%m-%d %I:%M %p")(utcDate.getTime() + utcDate.getTimezoneOffset() * 60000)}<br>Price: ${d3.format("$,.2f")(d.price)}`);
                }
                tooltip.style("left", `${d3.pointer(event)[0] + 180}px`)
                .style("top", `${d3.pointer(event)[1] + 210}px`);
            })
            .on('mouseout', () => {
                tooltip.transition().duration(500).style('opacity', 0);
            });

        // Add axes
        const xAxis = d3.axisBottom(xScale);
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
ScreenerLine.propTypes = {
    data: PropTypes.arrayOf(PropTypes.shape({
        time: PropTypes.string.isRequired,
        price: PropTypes.number.isRequired
    })).isRequired,
    colors: PropTypes.shape({
        line: PropTypes.string,
        hover: PropTypes.string
    })
};

export { ScreenerLine };