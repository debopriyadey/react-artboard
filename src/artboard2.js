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


const generator = rough.generator();

const nearPoint = (x, y, x1, y1, name) => {
    return Math.abs(x - x1) < 5 && Math.abs(y - y1) < 5 ? name : null;
};

const pointIsOnLine = (lineStart, lineEnd, point, name) => {
    const offset = distance(lineStart, lineEnd) - (distance(lineStart, point) + distance(lineEnd, point));
    return Math.abs(offset) < 1 ? name : null;
};

const point = (x, y) => ({ x, y });

const positionWithinElement = (x, y, element) => {
    const { type, x1, x2, y1, y2 } = element;
    // console.log(type, x1, x2, y1, y2)
    if (type === "img") {
        // console.log("type img")
        const topLeft = nearPoint(x, y, x1, y1, "tl");
        const topRight = nearPoint(x, y, x2, y1, "tr");
        const bottomLeft = nearPoint(x, y, x1, y2, "bl");
        const bottomRight = nearPoint(x, y, x2, y2, "br");

        const top = pointIsOnLine(point(x1, y1), point(x2, y1), point(x, y), "t");
        const right = pointIsOnLine(point(x2, y1), point(x2, y2), point(x, y), "r");
        const bottom = pointIsOnLine(point(x1, y2), point(x2, y2), point(x, y), "b");
        const left = pointIsOnLine(point(x1, y1), point(x1, y2), point(x, y), "l");

        const inside = x >= x1 && x <= x2 && y >= y1 && y <= y2 ? "inside" : null;
        return (
            topLeft || topRight || bottomLeft || bottomRight || top || right || bottom || left || inside
        );
    } else {
        const start = nearPoint(x, y, x1, y1, "start");
        const end = nearPoint(x, y, x2, y2, "end");
        const inside = pointIsOnLine(point(x1, y1), point(x2, y2), point(x, y), "inside")
        return start || end || inside;
    }
};

const distance = (a, b) => Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));

const getElementAtPosition = (x, y, elements) => {
    return elements
        .map(element => ({ ...element, position: positionWithinElement(x, y, element) }))
        .find(element => element.position !== null);
};

const adjustElementCoordinates = element => {
    const { type, x1, y1, x2, y2 } = element;
    if (type === "img") {
        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);
        const minY = Math.min(y1, y2);
        const maxY = Math.max(y1, y2);
        return { x1: minX, y1: minY, x2: maxX, y2: maxY };
    } else {
        if (x1 < x2 || (x1 === x2 && y1 < y2)) {
            return { x1, y1, x2, y2 };
        } else {
            return { x1: x2, y1: y2, x2: x1, y2: y1 };
        }
    }
};

const cursorForPosition = position => {
    switch (position) {
        case "tl":
        case "br":
        case "start":
        case "end":
            return "nwse-resize";
        case "tr":
        case "bl":
            return "nesw-resize";
        case "t":
        case "b":
            return "ns-resize";
        case "r":
        case "l":
            return "ew-resize";
        default:
            return "move";
    }
};

const resizedCoordinates = (clientX, clientY, position, coordinates) => {
    const { x1, y1, x2, y2 } = coordinates;
    switch (position) {
        case "tl":
        case "start":
            return { x1: clientX, y1: clientY, x2, y2 };
        case "tr":
            return { x1, y1: clientY, x2: clientX, y2 };
        case "bl":
            return { x1: clientX, y1, x2, y2: clientY };
        case "br":
        case "end":
            return { x1, y1, x2: clientX, y2: clientY };
        case "t":
            return { x1, y1: clientY, x2, y2 };
        case "r":
            return { x1, y1, x2: clientX, y2 };
        case "b":
            return { x1, y1, x2, y2: clientY };
        case "l":
            return { x1: clientX, y1, x2, y2 };
        default:
            return null; //should not really get here...
    }
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

    const createElement = (id, x1, y1, x2, y2, type) => {
        // contextRef.current.drawImage(id, x1, y1, x2, y2, type);
        return { id, x1, y1, x2, y2, type };
    }

    const updateElement = (id, x1, y1, x2, y2, type) => {
        const updatedElement = createElement(id, x1, y1, x2, y2, type);

        const elementsCopy = [...elements];
        elementsCopy[id] = updatedElement;
        setElements(elementsCopy);
    };


    UseEffect(() => {
        contextRef.current.strokeStyle = pencil.color;
        contextRef.current.lineWidth = pencil.width;
    }, [pencil])

    UseEffect(() => {
        writeText({ text: 'REACT-ARTBOARD', x: 20, y: 20 });
    }, []);

    const startDrawing = ({ nativeEvent }) => {
        const { clientX, clientY } = nativeEvent;
        if (tool === "selection") {
            console.log("inside selection")
            const element = getElementAtPosition(clientX, clientY, elements);
            console.log(element)
            if (element) {
                const offsetX = clientX - element.x1;
                const offsetY = clientY - element.y1;
                setSelectedElement({ ...element, offsetX, offsetY });

                if (element.position === "inside") {
                    setAction("moving");
                } else {
                    setAction("resizing");
                }
            }
        } else {
            contextRef.current.beginPath();
            contextRef.current.moveTo(clientX, clientY);
            setIsDrawing(true);
        }
    };

    const finishDrawing = () => {
        if (selectedElement) {
            const index = selectedElement.id;
            const { id, type } = elements[index];
            if (action === "drawing" || action === "resizing") {
                const { x1, y1, x2, y2 } = adjustElementCoordinates(elements[index]);
                updateElement(id, x1, y1, x2, y2, type);
            }
        }
        setAction("none");
        setSelectedElement(null);
        contextRef.current.closePath();
        setIsDrawing(false);
    };

    const draw = ({ nativeEvent }) => {

        const { clientX, clientY } = nativeEvent;
        if (tool === "selection") {
            const element = getElementAtPosition(clientX, clientY, elements);
            nativeEvent.target.style.cursor = element ? cursorForPosition(element.position) : "default";
        }

        if (!isDrawing) {
            return;
        }
        contextRef.current.lineTo(clientX, clientY);
        contextRef.current.stroke();

        if (action === "drawing") {
            const index = elements.length - 1;
            const { x1, y1 } = elements[index];
            updateElement(index, x1, y1, clientX, clientY, tool);
        } else if (action === "moving") {
            const { id, x1, x2, y1, y2, type, offsetX, offsetY } = selectedElement;
            const width = x2 - x1;
            const height = y2 - y1;
            const newX1 = clientX - offsetX;
            const newY1 = clientY - offsetY;
            updateElement(id, newX1, newY1, newX1 + width, newY1 + height, type);
        } else if (action === "resizing") {
            const { id, type, position, ...coordinates } = selectedElement;
            const { x1, y1, x2, y2 } = resizedCoordinates(clientX, clientY, position, coordinates);
            updateElement(id, x1, y1, x2, y2, type);
        }
    };

    const nothing = () => {

    }

    const getPosition = ({ nativeEvent }) => {
        const { clientX, clientY} = nativeEvent;
        setPosition([...position, { x: clientX, y: clientY }])
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
                const id = elements.length;
                const element = createElement(id, 100, 100, myImage.width * 0.5 + 100, myImage.height * 0.5 + 100, "img");
                setElements(prevState => [...prevState, element]);
                setSelectedElement(element);
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

    console.log(elements)

    return (
        <>
            <div className="App" ref={canvasInput}>
                {position.map((pos) => (
                    <textarea style={{ position: "absolute", left: `${pos.x}px`, top: `${pos.y}px` }} />
                ))}
                <div className="canvas-container">
                    <canvas
                        
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
