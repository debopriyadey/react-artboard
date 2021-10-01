import React, { useEffect as UseEffect, useState as UseState, useRef as UseRef } from 'react'
import { SketchPicker } from 'react-color';

import { FaDownload, FaUndo, FaPenAlt, FaImages, FaEraser, FaHandPointer } from 'react-icons/fa';
import { IoMdColorPalette } from 'react-icons/io'
import { ImCancelCircle } from 'react-icons/im'
import './App.css'

import rough from 'roughjs/bundled/rough.esm';
import { Modal, Box } from '@mui/material';

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
};


export default function artboard() {
    const [isDrawing, setIsDrawing] = UseState(false)
    const [menuItem, setMenuItem] = UseState('')
    const [position, setPosition] = UseState([])
    const [pencil, setPencil] = UseState({
        color: 'black',
        width: '2'
    })

    const [text, setText] = UseState('')
    const [openI, setOpenI] = UseState(false);
    const [file, setFile] = UseState(null);
    const [elements, setElements] = UseState([]);
    const [tool, setTool] = UseState("line");
    const [action, setAction] = UseState("none");
    const [selectedElement, setSelectedElement] = UseState(null);

    const canvasRef = UseRef(null);
    const contextRef = UseRef(null);
    const canvasInput = UseRef(null)

    UseEffect(() => {
        const canvas = canvasRef.current
        canvas.width = window.innerWidth * 2;
        canvas.height = window.innerHeight * 2;
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;
        const context = canvas.getContext("2d")
        context.scale(2, 2);
        context.lineCap = "round";
        contextRef.current = context;
    }, [])

    UseEffect(() => {
        contextRef.current.strokeStyle = pencil.color;
        contextRef.current.lineWidth = pencil.width;
    }, [pencil])

    UseEffect(() => {
        writeText({ text: 'REACT-ARTBOARD', x: 20, y: 20 });
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

        const { offsetX, offsetY } = nativeEvent;

        if (!isDrawing) {
            return;
        }
        contextRef.current.lineTo(offsetX, offsetY);
        contextRef.current.stroke();
    };

    const nothing = () => {

    }

    const getPosition = ({ nativeEvent }) => {
        const { offsetX, offsetY } = nativeEvent;
        setPosition([...position, { x: offsetX, y: offsetY }])
        console.log(position)
        // const inputText = document.createElement("textarea")
        // canvasInput.current.appendChild(inputText)
        // inputText.style.position = "absolute"
        // inputText.style.left = offsetX + 'px'
        // inputText.style.top = offsetY + 'px'
        // let writenText = ''
        // writeText({ text: writenText == null ? '' : writenText, x: offsetX, y: offsetY });
    }

    const selectPen = () => {
        setMenuItem('pen')
        setPencil({ ...pencil, color: 'black', width: '1' })
    }

    const selectText = () => {
        setMenuItem('text')
    }

    const handleImage = (e) => {
        e.preventDefault()
        handleCloseI()
        console.log(file)
        var reader = new FileReader();
        reader.readAsDataURL(file);
        console.log('loading image')
        console.log(file)
        reader.onloadend = () => {
            console.log('creating image')
            var myImage = new Image(); // Creates image object
            myImage.src = URL.createObjectURL(file); // Assigns converted image to image object
            console.log(myImage)
            myImage.onload = () => {
                contextRef.current.drawImage(myImage, 100, 100, myImage.width * 0.5, myImage.height * 0.5); // Draws the image on canvas
                // let imgData = contextRef.current.toDataURL("image/jpeg", 0.75);
            }
        }
    }

    const selectErase = () => {
        setPencil({ ...pencil, color: 'white', width: '5' })
    }

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d")
        context.fillStyle = "white"
        context.fillRect(0, 0, canvas.width, canvas.height)
        const removeText = document.querySelectorAll('textarea')
        console.log(removeText)
        if (removeText != null) {
            removeText.forEach(element => {
                canvasInput.current.removeChild(element)
            })
        };
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

    const handleChangeComplete = (color) => {
        setPencil({ ...pencil, color: color.hex })
        console.log(pencil.color)
    };

    const handleOpenI = () => setOpenI(true);
    const handleCloseI = () => setOpenI(false);


    UseEffect(() => {
        menuItem == 'text' ? window.document.getElementById('canvas').style.cursor = "text" : window.document.getElementById('canvas').style.cursor = "crosshair"
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
                {position.map((pos) => (
                    <textarea style={{ position: "absolute", left: `${pos.x}px`, top: `${pos.y}px` }} />
                ))}
                <div className="canvas-container">
                    <canvas
                        height="300px"
                        className="drawing-board"
                        id="canvas"
                        onMouseDown={menuItem == 'text' ? getPosition : startDrawing}
                        onMouseUp={menuItem == 'text' ? nothing : finishDrawing}
                        onMouseMove={menuItem == 'text' ? nothing : draw}
                        ref={canvasRef}
                    />
                </div>
            </div>
            <br />
            <div className="pen-menu" style={{ display: 'none' }}>
                <SketchPicker
                    color={pencil.color}
                    onChangeComplete={handleChangeComplete}
                />
                <div className="pen-width">
                    <p className="pen-width-view">{pencil.width}</p>
                    <input
                        id="typeinp"
                        type="range"
                        min="0"
                        max="10"
                        step="0.5"
                        defaultValue="3"
                        onChange={(e) => setPencil({ ...pencil, width: e.target.value })}
                    />
                </div>
            </div>
            <div className="menu-bar">
                <div className="menu-item">
                    <button onClick={() => setTool("selection")}><FaHandPointer /></button>
                </div>
                <div className="menu-item">
                    <button onClick={selectPen}><FaPenAlt /></button>
                </div>
                <div className="menu-item">
                    <button onClick={selectText}><strong>T</strong></button>
                </div>
                <div className="menu-item">
                    <button onClick={selectErase}><FaEraser /></button>
                </div>
                <div className="menu-item">
                    <button onClick={handleOpenI}><FaImages /></button>
                </div>
                <div className="menu-item">
                    <button onClick={clearCanvas}><FaUndo /></button>
                </div>
                <div className="menu-item">
                    <button onClick={download}><FaDownload /></button>
                </div>
            </div>
            <Modal
                open={openI}
                onClose={handleCloseI}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box sx={style}>
                    <form onSubmit={handleImage} >
                        <label>Upload File</label>
                        <input
                            type="file"
                            id="file"
                            accept=".png,.jpeg,.jpg"
                            onChange={(e) => setFile(e.target.files[0])}
                        />
                        <button type="submit">Submit</button>
                        <br />
                        {file ? (
                            <div className="book-preview">
                                <img className="preview-img" src={URL.createObjectURL(file)} alt="" width="200px" />
                                <ImCancelCircle className="sell-cancel-svg" onClick={() => setFile(null)} />
                            </div>
                        ) : (<div></div>)}
                    </form>
                </Box>
            </Modal>
        </>
    );
}
