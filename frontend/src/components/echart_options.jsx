export const getCandlestickChartOptions = (ticker, stockDetailsChartData, colors) => {
    return {
        title: {
            text: `Candlestick Chart for ${ticker}`,
            left: 'left',
            textStyle: { color: colors.grey[100] },
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross',
                backgroundColor: colors.primary[500],
                color: colors.grey[100]
            },
            backgroundColor: colors.primary[500],
            textStyle: {
                color: colors.grey[100]
            },
            borderColor: colors.grey[700],
            borderWidth: 1
        },
        grid: {
            left: '0%',
            right: '2%',
            bottom: '5%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: stockDetailsChartData.map(stock => stock.timestamp_end.toLocaleString()),
            axisLine: {
                lineStyle: {
                    color: colors.grey[100]
                }
            },
            splitLine: { show: false },
            scale: true,
            boundaryGap: false,
            inverse: true,
            axisPointer: {
                label: {
                    backgroundColor: colors.primary[500],
                    color: colors.grey[100],
                    borderColor: colors.grey[700],
                    borderWidth: 1
                }
            }
        },
        yAxis: {
            type: 'value',
            axisLine: {
                lineStyle: {
                    color: colors.grey[100]
                },
            },
            splitLine: {
                lineStyle: {
                    color: colors.grey[700],
                }
            },
            scale: true,
            axisPointer: {
                label: {
                    backgroundColor: colors.primary[500],
                    color: colors.grey[100],
                    borderColor: colors.grey[700],
                    borderWidth: 1
                }
            }
        },
        dataZoom: [
            {
                type: 'slider',
                xAxisIndex: 0,
                start: 0,
                end: 100,
                handleSize: '80%',
                height: 5,
                bottom: 5,
                textStyle: {
                    color: colors.grey[100]
                }
            },
            {
                type: 'inside',
                xAxisIndex: 0,
                start: 0,
                end: 100
            }
        ],
        series: [{
            type: 'candlestick',
            name: ticker,
            data: stockDetailsChartData.map(stock => [stock.open, stock.close, stock.low, stock.high]),
            itemStyle: {
                color: colors.redAccent[500],
                color0: colors.greenAccent[700],
                borderColor: colors.greenAccent[700],
                borderColor0: colors.redAccent[500],
            },
            emphasis: {
                itemStyle: {
                    color: colors.redAccent[500],
                    color0: colors.greenAccent[700],
                }
            }
        }],
        backgroundColor: colors.primary[500],
    };
};
