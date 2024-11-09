// src/components/echart_options.jsx
export const getCandlestickChartOptions = (
  ticker,
  stockDetailsChartData,
  colors
) => {
  // Return the configuration object for the candlestick chart
  return {
    // Title configuration
    title: {
      text: `Candlestick Chart for ${ticker}`,
      left: "left",
      textStyle: { color: colors.grey[100] },
    },

    // Tooltip configuration for displaying data on hover
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "cross",
        backgroundColor: colors.primary[500],
        color: colors.grey[100],
      },
      backgroundColor: colors.primary[500],
      textStyle: {
        color: colors.grey[100],
      },
      borderColor: colors.grey[700],
      borderWidth: 1,
    },

    // Grid layout configuration
    grid: {
      left: "0%",
      right: "2%",
      bottom: "5%",
      containLabel: true,
    },

    // X-axis configuration for time or category data
    xAxis: {
      type: "category",
      data: stockDetailsChartData.map((stock) =>
        stock.timestamp_end.toLocaleString()
      ),
      axisLine: {
        lineStyle: {
          color: colors.grey[100],
        },
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
          borderWidth: 1,
        },
      },
    },

    // Y-axis configuration for price values
    yAxis: {
      type: "value",
      axisLine: {
        lineStyle: {
          color: colors.grey[100],
        },
      },
      splitLine: {
        lineStyle: {
          color: colors.grey[700],
        },
      },
      scale: true,
      axisPointer: {
        label: {
          backgroundColor: colors.primary[500],
          color: colors.grey[100],
          borderColor: colors.grey[700],
          borderWidth: 1,
        },
      },
    },

    // Data zoom configuration for horizontal scrolling and zooming
    dataZoom: [
      {
        type: "slider",
        xAxisIndex: 0,
        start: 0,
        end: 100,
        handleSize: "80%",
        height: 5,
        bottom: 5,
        textStyle: {
          color: colors.grey[100],
        },
      },
      {
        type: "inside",
        xAxisIndex: 0,
        start: 0,
        end: 100,
      },
    ],

    // Series data for the candlestick chart
    series: [
      {
        type: "candlestick",
        name: ticker,
        data: stockDetailsChartData.map((stock) => [
          stock.open,
          stock.close,
          stock.low,
          stock.high,
        ]),
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
          },
        },
      },
    ],

    // Background color for the chart
    backgroundColor: colors.primary[500],
  };
};
