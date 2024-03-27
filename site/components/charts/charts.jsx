import React from "react"
import PropTypes from 'prop-types'

import styles from "./styles.module.scss"

import * as d3_scale from "d3-scale";
import * as d3_axis from "d3-axis";
import * as d3_select from "d3-selection";
import * as d3_format from "d3-format";

// function isSSR() {
//   return !(
//     typeof window !== 'undefined' &&
//     window.document &&
//     window.document.createElement);
// }

class BaseD3Chart extends React.Component {
  componentDidMount() {
    this.drawChart(this.refs.svg);
  }

  drawLegend() {
    return null;
  }

  render() {
    let cmp;

    // if (!isSSR()) {
      cmp = <svg className={styles.chart} ref="svg"></svg>;
    // }
    // else {
    //   /* We're in SSR; import react-faux-dom in such a way that
    //      webpack can't track it as a dependancy */
    //   let rfdFactory = global['require']('react-faux-dom/lib/factory');

    //   /* Render the d3 chart server side! */
    //   let rfd = rfdFactory();
    //   let el = new rfd.Element('svg');
    //   el.setAttribute('class', styles.chart)
    //   this.drawChart(el, this.props.data);
    //   cmp = el.toReact();
    // }

    return <div className={styles.chart_container}>
      <div className={styles.svg_container}>
        {cmp}
      </div>
      {this.drawLegend()}
    </div>
  }
}


export class BarLatencyChart extends BaseD3Chart {
  static propTypes = {
    options: PropTypes.shape({
      titleField: PropTypes.string.isRequired,
      stacked: PropTypes.bool.isRequired,
      stackedCategories: PropTypes.arrayOf(PropTypes.string),
      stackedCategoryField: PropTypes.string,
      dataField: PropTypes.string.isRequired,
      keyMetricField: PropTypes.string.isRequired,
      boxYTitle: PropTypes.string.isRequired,
      height: PropTypes.number,
      width: PropTypes.number,
      padding: PropTypes.arrayOf(PropTypes.number),
      colors: PropTypes.arrayOf(PropTypes.string),
      drawLegend: PropTypes.bool,
      legendMsg: PropTypes.string,
      boldRegex: PropTypes.string,
    }).isRequired,
    data: PropTypes.array,
  };

  drawLegend() {
    let opts = this.props.options;
    if (!opts.drawLegend || !opts.stacked || !opts.stackedCategories) {
      return null;
    }

    let colors = opts.colors || DEFAULT_COLORS;
    let items = [];

    for (let i = 0; i < opts.stackedCategories.length; i++) {
      items.push(
        <div className={styles.legend_item} key={i}>
          <div className={styles.legend_color}
               style={{background: colors[i]}}></div>
          <div className={styles.legend_caption}>
            {opts.stackedCategories[i]}
          </div>
        </div>
      );
    }

    return <div className={styles.legend}>
      {opts.legendMsg ?
        <div className={styles.legend_msg}>{opts.legendMsg}</div> : null}
      <div className={styles.legend_items}>{items}</div>
    </div>
  }

  drawChart(el) {
    // geometry

    let {titleField, stacked, dataField, keyMetricField,
         stackedCategories, stackedCategoryField,
         barYTitle, padding, boldRegex} = this.props.options;

    let data = this.props.data,
        fullWidth = this.props.options.width || 900,
        fullHeight = this.props.options.height || 370,
        margin = {
          top: padding ? padding[0] : 10,
          right: padding ? padding[1] : 0,
          bottom: padding ? padding[2] : 70,
          left: padding ? padding[3] : 80
        },
        width = fullWidth - margin.left - margin.right,
        height = fullHeight - margin.top - margin.bottom,
        benchmarks = data,
        stackedData = data;

    if (boldRegex) {
      boldRegex = new RegExp(boldRegex, 'g');
    }

    if (!stacked) {
      stackedData = [];
      benchmarks.forEach((bench) => {
        let newBench = Object.assign({}, bench);
        bench[dataField][titleField] = bench[titleField];
        newBench[dataField] = [bench[dataField]];
        stackedData.push(newBench);
      });
    } else {
      var newBench = [];
      Array.prototype.push.apply(newBench, stackedData);
      newBench.sort(function(e1, e2) {
          let v1 = e1[dataField].reduce(
            function(s, el) { return s + el[keyMetricField] }, 0);
          let v2 = e2[dataField].reduce(
            function(s, el) { return s + el[keyMetricField] }, 0);
          return v1 < v2 ? -1 : 1;
      })
      stackedData = newBench;
    }

    // data reshape

    let maxRps = 0;
    stackedData.forEach((bench) => {
      bench[dataField].forEach(function(v) {
        if (v[keyMetricField] > maxRps) {
          maxRps = v[keyMetricField]
        }
      })
    });

    let names = stackedData.map(d => d[titleField]);

    // charting

    let color = d3_scale.scaleOrdinal().range(
      this.props.options.colors || DEFAULT_COLORS);

    let x0 =
      d3_scale.scaleBand()
        .domain(names)
        .range([0, width])
        .padding(0.2);

    let x1 = null;
    if (stacked) {
      x1 = d3_scale.scaleBand()
        .domain(stackedCategories)
        .rangeRound([0, x0.bandwidth()])
        .padding(0.2);
    }

    let y =
      d3_scale.scaleLinear()
        .range([height, 0])
        .domain([0, maxRps]);

    let xAxis =
      d3_axis.axisBottom(x0)
        .tickFormat((d) => d.split(/\-|\s|_/g)[0]);

    let xAxis2 =
      d3_axis.axisBottom(x0)
        .tickFormat(d => d.split(/\-|\s|_/g)[1]);

    let xAxis3 =
      d3_axis.axisBottom(x0)
      .tickFormat(d => d.split(/\-|\s|_/g)[2]);

    let yAxis = d3_axis.axisLeft(y);

    let chart =
      d3_select.select(el)
        .attr('viewBox', `0 0 ${fullWidth} ${fullHeight}`)
        .append("g")
          .attr("transform", `translate(${margin.left}, ${margin.top})`);

    chart.append("g")
      .attr("class", `${styles.x} ${styles.axis}`)
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

    chart.append("g")
      .attr("class", `${styles.x} ${styles.axis} ${styles.x2}`)
      .attr("transform", `translate(0, ${height + 18})`)
      .call(xAxis2);

    chart.append("g")
      .attr("class", `${styles.x} ${styles.axis} ${styles.x2}`)
      .attr("transform", `translate(0, ${height + 36})`)
      .call(xAxis3);

    if (boldRegex) {
      chart.selectAll(`g.${styles.x} text`)
        .filter(d => !!(d && d.match(boldRegex)))
        .attr("font-weight", "bold");
    }

    chart.append("g")
      .attr("class", `${styles.y} ${styles.axis}`)
      .call(yAxis)
      .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text(barYTitle);

    let bench = chart.selectAll(".bench")
            .data(stackedData)
            .enter().append("g")
                .attr("class", "bench");

    if (stacked) {
      bench = bench.attr("transform", function(d) {
          return "translate(" + x0(d[titleField]) + ",0)";
      });
    }

    bench.selectAll("rect")
      .data(function(d) { return d[dataField]; })
      .enter().append("rect")
        .style("fill", (d, i) => color(i))
        .attr("width", x1 ? x1.bandwidth() : x0.bandwidth())
        .attr("x", (d, i) => {
          return x1 ? x1(stackedCategories[i]) : x0(d[titleField])
        })
        .attr("y", d => y(d[keyMetricField]))
        .attr("height", d => (height - y(d[keyMetricField])))
        .on("mouseover", function(d, i) {
          focusRect.attr('y', y(d[keyMetricField]) - 9);

          focusLine
            .attr('y1', y(d[keyMetricField]))
            .attr('y2', y(d[keyMetricField]));

          focusText
            .attr('y', y(d[keyMetricField]))
            .text(d3_format.format(",.4r")(
              Math.round(d[keyMetricField])));

          focus.style("display", null);
        })
        .on("mouseout", () => focus.style("display", 'none'));

    let focus =
      chart.append('g')
        .attr('class', `${styles.focus}`)
        .style('display', 'none');

    let focusRect =
      focus.append('rect')
        .attr('x', -margin.left)
        .attr('width', margin.left - 6)
        .attr('y', 0)
        .attr('height', 18)
        .attr('fill', 'rgba(255, 255, 255, 0.9)');

    let focusLine =
      focus.append('line')
        .attr('x1', -6)
        .attr('x2', width - 20)
        .attr('y1', 0)
        .attr('y2', 0)
        .style("stroke-dasharray", "2,2");

    let focusText =
      focus.append('text')
        .attr('y', 0)
        .attr('x', -9)
        .attr('text-anchor', 'end')
        .attr('alignment-baseline', 'middle');
  }
}


export class BoxLatencyChart extends BaseD3Chart {
  static propTypes = {
    options: PropTypes.shape({
      titleField: PropTypes.string.isRequired,
      stacked: PropTypes.bool.isRequired,
      stackedCategories: PropTypes.arrayOf(PropTypes.string),
      stackedCategoryField: PropTypes.string,
      dataField: PropTypes.string.isRequired,
      keyMetricField: PropTypes.string.isRequired,
      barYTitle: PropTypes.string.isRequired,
      height: PropTypes.number,
      width: PropTypes.number,
      padding: PropTypes.arrayOf(PropTypes.number),
      colors: PropTypes.arrayOf(PropTypes.string),
    }).isRequired,
    data: PropTypes.array,
  };

  drawChart(el) {
    // geometry

    let {titleField, stacked, dataField, keyMetricField,
         stackedCategories, stackedCategoryField,
         boxYTitle, padding} = this.props.options;

    let data = this.props.data,
        fullWidth = this.props.options.width || 900,
        fullHeight = this.props.options.height || 370,
        margin = {
          top: padding ? padding[0] : 10,
          right: padding ? padding[1] : 0,
          bottom: padding ? padding[2] : 70,
          left: padding ? padding[3] : 80
        },
        width = fullWidth - margin.left - margin.right,
        height = fullHeight - margin.top - margin.bottom,
        benchmarks = data,
        stackedData = data;

    if (!stacked) {
      stackedData = [];
      benchmarks.forEach((bench) => {
        let newBench = Object.assign({}, bench);
        bench[dataField][titleField] = bench[titleField];
        newBench[dataField] = [bench[dataField]];
        stackedData.push(newBench);
      });
    }

    // data reshape

    let maxLat = 0;
    stackedData.forEach((bench) => {
      bench[dataField].forEach(function(v) {
        if (v.latency_percentiles[4][1] > maxLat) {
          maxLat = v.latency_percentiles[4][1];
        }
      })
    });

    let names = benchmarks.map(d => d[titleField]);

    // charting

    let color = d3_scale.scaleOrdinal().range(
      this.props.options.colors || DEFAULT_COLORS);

    let x0 =
      d3_scale.scaleBand()
        .range([0, width])
        .padding(0.2)
        .domain(names);

    let x1 = null;
    if (stacked) {
      x1 = d3_scale.scaleBand()
        .domain(stackedCategories)
        .rangeRound([0, x0.bandwidth()])
        .padding(0.2);
    }

    let y =
      d3_scale.scaleLinear()
        .range([height, 0])
        .domain([0, maxLat]);

    let xAxis =
      d3_axis.axisBottom(x0)
        .tickFormat(d => d.split(/\-|\s|_/g)[0]);

    let xAxis2 =
      d3_axis.axisBottom(x0)
        .tickFormat(d => d.split(/\-|\s|_/g)[1]);

    let xAxis3 =
      d3_axis.axisBottom(x0)
        .tickFormat(d => d.split(/\-|\s|_/g)[2]);


    let yAxis = d3_axis.axisLeft(y);

    let chart =
      d3_select.select(el)
        .attr('viewBox', `0 0 ${fullWidth} ${fullHeight}`)
        .append("g")
          .attr("transform",
                `translate(${margin.left}, ${margin.top})`);

    chart.append("g")
      .attr("class", `${styles.x} ${styles.axis}`)
      .attr("transform", `translate(0, ${height})`)
      .call(xAxis);

    chart.append("g")
      .attr("class", `${styles.x} ${styles.axis} ${styles.x2}`)
      .attr("transform", `translate(0, ${height + 18})`)
      .call(xAxis2);

    chart.append("g")
      .attr("class", `${styles.x} ${styles.axis} ${styles.x2}`)
      .attr("transform", `translate(0, ${height + 36})`)
      .call(xAxis3);

    chart.append("g")
      .attr("class", `${styles.y} ${styles.axis}`)
      .call(yAxis)
      .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text(boxYTitle);

    let bench = chart.selectAll(".bench")
            .data(stackedData)
            .enter().append("g")
                .attr("class", "bench");

    if (stacked) {
      bench = bench.attr("transform", function(d) {
          return "translate(" + x0(d[titleField]) + ",0)";
      });
    }
    var g =
      bench.selectAll("rect")
        .data(function(d) { return d[dataField]; })
        .enter().append("g")
            .attr('class', `${styles.sub}`);

    let X = (d, i) => (x1 ? x1(stackedCategories[i]) : x0(d[titleField]));
    let DX = x1 ? x1.bandwidth() : x0.bandwidth();

    g.append('line')
      .attr('y1', d => y(d.latency_percentiles[4][1]))
      .attr('y2', d => y(d.latency_percentiles[4][1]))
      .attr('x1', X)
      .attr('x2', (d, i) => X(d, i) + DX)
      .style("stroke", (d, i) => color(i));

    g.append('line')
      .attr('y1', d => y(d.latency_min))
      .attr('y2', d => y(d.latency_min))
      .attr('x1', X)
      .attr('x2', (d, i) => (X(d, i) + DX))
      .style("stroke", (d, i) => color(i));

    g.append('line')
      .attr('y1', d => y(d.latency_percentiles[1][1]))
      .attr('y2', d => y(d.latency_percentiles[1][1]))
      .attr('x1', X)
      .attr('x2', (d, i) => (X(d, i) + DX))
      .style("stroke", (d, i) => color(i));

    g.append('line')
      .attr('y1', d => y(d.latency_min))
      .attr('y2', d => y(d.latency_percentiles[0][1]))
      .attr('x1', (d, i) => (X(d, i) + DX / 2))
      .attr('x2', (d, i) => (X(d, i) + DX / 2))
      .style("stroke", (d, i) => color(i))
      .style("stroke-dasharray", "2,2");

    g.append('line')
      .attr('y1', d => y(d.latency_percentiles[4][1]))
      .attr('y2', d => y(d.latency_percentiles[2][1]))
      .attr('x1', (d, i) => (X(d, i) + DX / 2))
      .attr('x2', (d, i) => (X(d, i) + DX / 2))
      .style("stroke", (d, i) => color(i))
      .style("stroke-dasharray", "2,2");

    g.append('rect')
      .attr('y', d => y(d.latency_percentiles[2][1]))
      .attr('x', X)
      .attr("width", DX)
      .attr('height', d => Math.abs(
        y(d.latency_percentiles[2][1]) -
        y(d.latency_percentiles[0][1])))
      .style("stroke", (d, i) => color(i))
      .style("fill", 'rgba(0, 0, 0, 0)');

    g.append('rect')
      .attr('y', 0)
      .attr('height', height)
      .attr('x', X)
      .attr('width', d => DX)
      .style('fill', 'rgba(0, 0, 0, 0)')
      .on("mouseout", function(d, i) {
        d3_select.select(this).style('fill', 'rgba(0, 0, 0, 0)');
        focus.style('display', 'none');
      })
      .on("mouseover", function(d, i) {
        d3_select.select(this).style('fill', 'rgba(0, 0, 0, 0.04)');

        let yMedian = y(d.latency_percentiles[1][1]);

        focus.style('display', null);

        focusLine.attr('y1', yMedian).attr('y2', yMedian);

        focusRect
          .attr('y', yMedian - 9);

        focusLine
          .attr('y1', yMedian)
          .attr('y2', yMedian);

        focusText
          .attr('y', yMedian)
          .text(d3_format.format(".2f")(
            d.latency_percentiles[1][1]));

      });

    var focus =
      chart.append('g')
        .attr('class', `${styles.focus}`)
        .style('display', 'none');

    var focusRect =
      focus.append('rect')
        .attr('x', -margin.left)
        .attr('width', margin.left - 6)
        .attr('y', 0)
        .attr('height', 18)
        .attr('fill', 'rgba(255, 255, 255, 0.9)');

    var focusLine =
      focus.append('line')
        .attr('x1', -6)
        .attr('x2', width - 20)
        .attr('y1', 0)
        .attr('y2', 0)
        .style("stroke-dasharray", "2,2");

    var focusText =
      focus.append('text')
        .attr('y', 0)
        .attr('x', -9)
        .attr('text-anchor', 'end')
        .attr('alignment-baseline', 'middle');
  }
}


export function BarBoxLatencyChart(props) {
  return <div>
    <BarLatencyChart {...props} />
    <BoxLatencyChart {...props} />
  </div>
}


const DEFAULT_COLORS = [
  "#047CFF", "#6b486b", "#ff8c00", "#8a89a6", "#7b6888", "#a05d56", "#d0743c"
];
