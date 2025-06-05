function _1(md){return(
md`# Zoomable Map Tiles

This notebook combines [d3-tile](https://github.com/d3/d3-tile) for displaying raster map tiles and [d3-zoom](https://github.com/d3/d3-zoom) for panning and zooming. Note that unlike dedicated libraries for slippy maps such as [Leaflet](/@mbostock/hello-leaflet), d3-tile relies on the browser for caching and queueing, and thus you may see more flickering as tiles load.`
)}

function _map(d3,width,height,url)
{
  const svg = d3.create("svg")
      .attr("viewBox", [0, 0, width, height]);

  const tile = d3.tile()
      .extent([[0, 0], [width, height]])
      .tileSize(512)
      .clampX(false);

  const zoom = d3.zoom()
      .scaleExtent([1 << 8, 1 << 22])
      .extent([[0, 0], [width, height]])
      .on("zoom", ({transform}) => zoomed(transform));

  let image = svg.append("g")
      .attr("pointer-events", "none")
    .selectAll("image");

  svg
      .call(zoom)
      .call(zoom.transform, d3.zoomIdentity
        .translate(width >> 1, height >> 1)
        .scale(1 << 12));

  function zoomed(transform) {
    const tiles = tile(transform);

    image = image.data(tiles, d => d).join("image")
        .attr("xlink:href", d => url(...d3.tileWrap(d)))
        .attr("x", ([x]) => (x + tiles.translate[0]) * tiles.scale)
        .attr("y", ([, y]) => (y + tiles.translate[1]) * tiles.scale)
        .attr("width", tiles.scale)
        .attr("height", tiles.scale);
  }

  return svg.node();
}


function _url(){return(
(x, y, z) => `https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/${z}/${x}/${y}${devicePixelRatio > 1 ? "@2x" : ""}?access_token=pk.eyJ1IjoibWJvc3RvY2siLCJhIjoiY2s5ZWRlbTM4MDE0eDNocWJ2aXR2amNmeiJ9.LEyjnNDr_BrxRmI4UDyJAQ`
)}

function _height(){return(
600
)}

function _d3(require){return(
require("d3@7", "d3-tile@1")
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  main.variable(observer()).define(["md"], _1);
  main.variable(observer("map")).define("map", ["d3","width","height","url"], _map);
  main.variable(observer("url")).define("url", _url);
  main.variable(observer("height")).define("height", _height);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  return main;
}
