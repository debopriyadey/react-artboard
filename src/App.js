import React, { useEffect, useState, useRef } from 'react'

import { FaDownload, FaUndo, FaPenAlt } from 'react-icons/fa';
import { IoMdColorPalette } from 'react-icons/io'
import './App.css'

function App() {
  const [isDrawing, setIsDrawing] = useState(false)
  const [menuItem, setMenuItem] = useState('')
  // const [position, setPosition] = useState({
  //   x: '',
  //   y: ''
  // })

  const [text, setText] = useState('')
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const canvasInput = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    canvas.width = window.innerWidth * 2;
    canvas.height = window.innerHeight * 2;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;

    const context = canvas.getContext("2d")
    context.scale(2, 2);
    context.lineCap = "round";
    context.strokeStyle = "black";
    context.lineWidth = 5;
    contextRef.current = context;
  }, [])

  useEffect(() => {
    writeText({ text: 'WELCOME HERE', x: 50, y: 50 });
  }, []);

  const startDrawing = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const finishDrawing = () => {
    contextRef.current.closePath();
    setIsDrawing(false);
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing) {
      return;
    }
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current.lineTo(offsetX, offsetY);
    contextRef.current.stroke();
  };

  const nothing = () => {

  }

  const getPosition = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    const inputText = document.createElement("textarea")
    canvasInput.current.appendChild(inputText)
    inputText.style.position = "absolute"
    inputText.style.left = offsetX + 'px'
    inputText.style.top = offsetY + 'px'
    // let writenText = ''
    // writeText({ text: writenText == null ? '' : writenText, x: offsetX, y: offsetY });
  }

  const selectPen = () => {
    setMenuItem('pen')
  }

  const selectText = () => {
    setMenuItem('text')
  }

  const selectColor = () => {

  }

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d")
    context.fillStyle = "white"
    context.fillRect(0, 0, canvas.width, canvas.height)
    const removeText = document.querySelectorAll('textarea')
    console.log(removeText)
    removeText.forEach(element => {
      canvasInput.current.removeChild(element)
    });
  }

  const download = async () => {
    const image = canvasRef.current.toDataURL('image/png');
    const blob = await (await fetch(image)).blob();
    const blobURL = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobURL;
    link.download = "image.png";
    link.click();
  }

  useEffect(() => {
    menuItem == 'text' ? window.document.getElementById('canvas').style.cursor = "text" : window.document.getElementById('canvas').style.cursor = "auto"
  }, [menuItem])

  const writeText = (info, style = {}) => {
    const { text, x, y } = info;
    const { fontSize = 30, fontFamily = 'Arial', color = 'black', textAlign = 'left', textBaseline = 'top' } = style;

    contextRef.current.beginPath();
    contextRef.current.font = fontSize + 'px ' + fontFamily;
    contextRef.current.textAlign = textAlign;
    contextRef.current.textBaseline = textBaseline;
    contextRef.current.fillStyle = color;
    contextRef.current.fillText(text, x, y);
    contextRef.current.stroke();
  }


  return (
    <>
      <div className="App" ref={canvasInput}>
        <canvas
          id="canvas"
          onMouseDown={menuItem == 'text' ? getPosition : startDrawing}
          onMouseUp={menuItem == 'text' ? nothing : finishDrawing}
          onMouseMove={menuItem == 'text' ? nothing : draw}
          ref={canvasRef}
        />
      </div>
      <br />
      <div className="menu-bar">
        <div className="menu-item">
          <button onClick={selectPen}><FaPenAlt /></button>
        </div>
        <div className="menu-item">
          <button onClick={selectText}><strong>T</strong></button>
        </div>
        {/* <div className="menu-item">
          <button onClick={selectColor}><IoMdColorPalette /></button>
        </div> */}
        <div className="menu-item">
          <button onClick={clearCanvas}><FaUndo /></button>
        </div>
        <div className="menu-item">
          <button onClick={download}><FaDownload /></button>
        </div>
      </div>
    </>
  );
}

export default App;