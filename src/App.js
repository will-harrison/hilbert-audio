import React, { Component } from 'react';
import styled from 'styled-components'
import h from 'hilbert'
import { Stage, Layer, Circle, Line, } from 'react-konva'
import Konva from 'konva'

const randRange = (min, max) => {
  return Math.random() * (max - min) + min
}

let H2 = h.Hilbert2d
let h2 = new H2()

class App extends Component {
  state = {
    height: window.innerHeight,
    width: window.innerWidth,
    points: new Uint8Array(),
    scale: 10,
    drawHilbert: true,
    linePoints: [],
    stream: null,
    analyzer: null
  }

  interpolate = (val, start1, stop1, start2, stop2) => {
    return ((val - start1) / (stop1 - start1)) * (stop2 - start2) + start2
  }

  componentDidMount = async () => {
    let config = {
      audio: true,
      video: false
    }
    navigator.mediaDevices.getUserMedia(config)
      .then((stream) => this.drawVisualization(stream))
      .catch(err => console.log(err))
  }

  drawVisualization = (stream) => {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    const input = audioCtx.createMediaStreamSource(stream)
    const analyzer = audioCtx.createAnalyser()

    analyzer.smoothingTimeConstant = 0.3;
    analyzer.fftSize = 2048;
    const bufferLength = analyzer.frequencyBinCount
    const hilbertSize = bufferLength * 8 / 256
    console.log(bufferLength)
    let dataArray = new Uint8Array(bufferLength)
    input.connect(analyzer)

    this.setState(state => {
      return {
        ...state,
        analyzer
      }
    })

    const draw = () => {
      let drawVisual = requestAnimationFrame(draw)
      analyzer.getByteTimeDomainData(dataArray)

      let value = 0
      let offset = 0
      let points = []
      for (let i = 0; i < dataArray.length; i++) {
        points.push({
          point: offset,
          vector: this.hilbertPointToXY(dataArray[i]),
          color: `rgba(${offset / 5}, 0, 0, .5)`,
          value: dataArray[i] - 100
        })
        offset += 1
      }
      this.setState(state => {
        return {
          ...state,
          points
        }
      })
    }

    // analyzer.connect(audioCtx.destination)
    draw()
    // this.draw(bufferLength)
    this.drawHilbert(hilbertSize)
  }


  getAverageVolume = array => {
    const length = array.length;
    let values = 0;
    let i = 0;

    for (; i < length; i++) {
      values += array[i];
    }

    return values / length;
  }

  // draw = (bufferLength) => {
  //   return new Promise(resolve => {
  //     let value = 0
  //     let offset = 0
  //     let points = []
  //     for (let index = 0; index < 256 * bufferLength; index++) {
  //       points.push({
  //         point: randRange(0, 1) ? offset : 0,
  //         vector: this.hilbertPointToXY(offset),
  //         color: `rgba(${offset / 2}, 0, 0, .5)`,
  //         value: offset
  //       })
  //       offset += 1
  //     }
  //     this.setState(state => {
  //       return {
  //         ...state,
  //         points
  //       }
  //     }, resolve)
  //   })
  // }

  drawHilbert = (bufferLength) => {
    let { drawHilbert, width, scale } = this.state
    let linePoints = []
    if (drawHilbert) {
      for (let i = 0; i < 256 * bufferLength; i++) {
        let blah = this.hilbertPointToXY(i)
        linePoints.push(blah.x * scale)
        linePoints.push(blah.y * scale)
      }
    }
    this.setState(state => {
      return {
        ...state,
        linePoints
      }
    })
  }

  hilbertPointToXY = (point) => {
    return h2.xy(point)
  }

  buildRandomPoints = () => {
    return new Promise((resolve) => {
      let points = []
      for (let i = 0; i < this.state.numberOfPoints; i++) {
        let point = randRange(0, 44000 * 100)
        points.push(
          {
            point: point,
            vector: this.hilbertPointToXY(point),
            color: `rgb(${randRange(0, 255)}, ${randRange(0, 255)}, ${randRange(0, 255)})`,
            value: randRange(1, 50)
          }
        )
      }
      this.setState(state => {
        return {
          ...state,
          points
        }
      }, resolve)
    })
  }


  render() {
    let { height, linePoints, points, scale, width } = this.state
    let hilbertCurve = new Konva.Line({
      points: linePoints,
      stroke: 'rgb(51, 51, 51)',

    })
    return (
      <HilbertStage width={width} height={height} >
        <Layer>
          <Line {...hilbertCurve} />
          {points && points.map((p, index) => {
            return <Circle x={p.vector.x * scale} y={p.vector.y * scale} radius={Math.max(p.value / 10, 0)} fill={p.color} key={index} />
          })}
        </Layer>
      </HilbertStage>
    );
  }
}

const HilbertStage = styled(Stage)`
  border: 1px solid black;
`

export default App;
