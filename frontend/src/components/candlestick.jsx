import React, { useEffect, useRef } from "react";
import * as d3 from 'd3';

// Component that renders a candlestick chart with tooltips
const CandlestickChart = ({ data, colors }) => {
    // Refs for the SVG container and tooltip
    const svgRef = useRef();
    const tooltipRef = useRef();

    useEffect(() => {
        // Skip rendering if no data is provided
        if (!data || data.length === 0) return;
        
        // Clear any existing SVG elements
        d3.select(svgRef.current).selectAll('svg').remove();
        
        // Define margins and dimensions
        const margin = { top: 20, right: 10, bottom: 90, left: 50 };
        const width = +svgRef.current.clientWidth - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        // Create main SVG container and transform group
        const svg = d3.select(svgRef.current)
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom);
        const g = svg
            .append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`);

        // Set up scales for x and y axes
        const x = d3.scaleTime()
            .range([0, width]);
        const y = d3.scaleLinear()
            .range([height, 0]);
        const xScale = d3.scaleBand()
            .range([0, width])
            .domain(data.map((d) => d.time))
            .padding(0.1);
        const yScale = d3.scaleLinear()
            .range([height, 0])
            .domain([d3.min(data, (d) => d.low), d3.max(data, (d) => d.high)]);
        
        // Create tooltip container
        const tooltip = d3.select(tooltipRef.current)
            .style("opacity", 0);

        // Draw horizontal grid lines
        g.selectAll('xGrid')
            .data(x.ticks().slice(1))
            .join('line')
            .attr('x1', d => x(d))
            .attr('x2', d => x(d))
            .attr('y1', 0)
            .attr('y2', height)
            .attr('stroke', colors.grey[200])
            .attr('stroke-width', .5);

        // Draw vertical grid lines
        g.selectAll('yGrid')
            .data(y.ticks().slice(1))
            .join('line')
            .attr('x1', 0)
            .attr('x2', width)
            .attr('y1', d => y(d))
            .attr('y2', d => y(d))
            .attr('stroke', colors.grey[200])
            .attr('stroke-width', .5);

        // Draw candlestick wicks (borders)
        g.selectAll(".wick-border")
            .data(data)
            .enter()
            .append("line")
            .attr("class", "wick-border")
            .attr("x1", d => xScale(d.time) + xScale.bandwidth() / 2)
            .attr("x2", d => xScale(d.time) + xScale.bandwidth() / 2)
            .attr("y1", d => yScale(d.high))
            .attr("y2", d => yScale(d.low))
            .attr("stroke", colors.grey[200])
            .attr("stroke-width", ((d, i) => {
                if (data.length > 100) {
                    return 1;
                } else if (data.length > 50) {
                    return 1;
                } else if (data.length > 20) {
                    return 3;
                } else {
                    return 3;
                }
            }))
            .attr("stroke-linecap", "round");

        // Draw candlestick wicks (colored lines)
        g.selectAll(".wick")
            .data(data)
            .enter()
            .append("line")
            .attr("class", "wick")
            .attr("x1", d => xScale(d.time) + xScale.bandwidth() / 2)
            .attr("x2", d => xScale(d.time) + xScale.bandwidth() / 2)
            .attr("y1", d => yScale(d.high))
            .attr("y2", d => yScale(d.low))
            .attr("stroke", d => d.open > d.close ? colors.redAccent[500] : colors.greenAccent[600])
            .attr("stroke-width", ((d, i) => {
                if (data.length > 100) {
                    return 0.5;
                } else if (data.length > 50) {
                    return 0.5;
                } else if (data.length > 20) {
                    return 1;
                } else {
                    return 1;
                }
            }))
            .attr("stroke-linecap", "round")
            .on("mouseover", (event, d) => {
                tooltip.transition().duration(200).style("opacity", 0.9);
                tooltip.html(`Open: ${d3.format("$,.2f")(d.open)}<br>Close: ${d3.format("$,.2f")(d.close)}<br>High: ${d3.format("$,.2f")(d.high)}<br>Low: ${d3.format("$,.2f")(d.low)}`)
                    .style("left", (event.pageX + 5) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", () => {
                tooltip.transition().duration(500).style("opacity", 0);
            });

        // Draw candlestick bodies (rectangles)
        g.selectAll('.candle')
            .data(data)
            .enter()
            .append('rect')
            .attr('class', 'candle')
            .attr('x', d => xScale(d.time))
            .attr('y', d => yScale(Math.max(d.open, d.close)))
            .attr('height', d => Math.abs(yScale(d.open) - yScale(d.close)))
            .attr('width', xScale.bandwidth())
            .attr('fill', d => d.open > d.close ? colors.redAccent[500] : colors.greenAccent[600])
            .attr('stroke', colors.grey[200])
            .attr('stroke-width', 0.5)
            .attr('rx', 5)
            .attr('ry', 5)
            .on("mouseover", (event, d) => {
                tooltip.transition().duration(200).style("opacity", 0.9);
                tooltip.html(`Open: ${d3.format("$,.2f")(d.open)}<br>Close: ${d3.format("$,.2f")(d.close)}<br>High: ${d3.format("$,.2f")(d.high)}<br>Low: ${d3.format("$,.2f")(d.low)}`)
                    .style("left", (event.pageX + 5) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", () => {
                tooltip.transition().duration(500).style("opacity", 0);
            });

        // Configure and add x-axis with rotated labels
        const xAxis = d3.axisBottom(xScale)
            .tickSize(0)
            .tickPadding(5)
            .ticks(1)
            .tickFormat((d, i) => {
                if (data.length > 100) {
                    return i % 10 === 0 ? d3.timeFormat("%b %Y")(d) : '';
                } else if (data.length > 50) {
                    return i % 5 === 0 ? d3.timeFormat("%b %Y")(d) : '';
                } else if (data.length > 20) {
                    return i % 1 === 0 ? d3.timeFormat("%b %d %Y")(d) : '';
                } else {
                    return i % 1 === 0 ? d3.timeFormat("%b %d %Y")(d) : '';
                }
            });
        g.append('g').attr('class', 'x-axis') 
            .attr('transform', `translate(0,${height})`)
            .call(xAxis)
            .style('color', colors.grey[200])
            .selectAll("text") 
            .attr("transform", "rotate(-45)") 
            .attr("text-anchor", "end")
            .attr("dx", "-0.5em") 
            .attr("dy", "0.5em"); 

        // Configure and add y-axis with price formatting
        const yAxis = d3.axisLeft(yScale)
            .tickSize(0)
            .tickPadding(10)
            .tickFormat(d3.format("$,.2f"));
        g.append('g').attr('class', 'y-axis') 
            .attr('transform', `translate(0, 0)`) 
            .call(yAxis)
            .style('color', colors.grey[200]);

    }, [data, colors]); // Re-render when data or colors change

    return (
        <>
            {/* Tooltip container */}
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
            {/* Main SVG container */}
            <svg ref={svgRef} style={{ height: 400, width: '100%' }}>
            </svg>
        </>
    );
};

export default CandlestickChart;