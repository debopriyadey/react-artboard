import React, { useEffect as UseEffect, useState as UseState, useRef as UseRef } from 'react'
import { SketchPicker } from 'react-color';

import { FaDownload, FaUndo, FaPenAlt, FaImages, FaEraser, FaHandPointer, FaCaretSquareRight } from 'react-icons/fa';
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
    const { type, x1, y1, x2, y2, image, width, height } = element;
    if (type === "img") {
        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);
        const minY = Math.min(y1, y2);
        const maxY = Math.max(y1, y2);
        return { x1: minX, y1: minY, x2: maxX, y2: maxY, image, width, height };
    } else {
        if (x1 < x2 || (x1 === x2 && y1 < y2)) {
            return { x1, y1, x2, y2, image, width, height };
        } else {
            return { x1: x2, y1: y2, x2: x1, y2: y1, image, width, height };
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

const resizedCoordinates = (offsetX, offsetY, position, x1, y1, x2, y2, widthX, heightY) => {
    switch (position) {
        case "tl":
        case "start":
            return { nx1: offsetX, ny1: offsetY, nx2: x2, ny2: y2, nwidthX: x2 - offsetX, nheightY: y2 - offsetY };
        case "tr":
            return { nx1: x1, ny1: offsetY, nx2: offsetX, ny2: y2, nwidthX: offsetX - x1, nheightY: y2 - offsetY };
        case "bl":
            return { nx1: offsetX, ny1: y1, nx2: x2, ny2: offsetY, nwidthX: x2 - offsetX, nheightY: offsetY - x1 };
        case "br":
        case "end":
            return { nx1: x1, ny1: y1, nx2: offsetX, ny2: offsetY, nwidthX: offsetX, heightY: offsetY };
        case "t":
            return { nx1: x1, ny1: offsetY, nx2: x2, ny2: y2, nwidthX: widthX, nheightY: y2 - offsetY };
        case "r":
            return { nx1: x1, ny1: y1, nx2: offsetX, ny2: y2, nwidthX: offsetX - x1, nheightY: heightY };
        case "b":
            return { nx1: x1, ny1: y1, nx2: x2, ny2: offsetY, nwidthX: widthX, nheightY: offsetY - y1 };
        case "l":
            return { nx1: offsetX, ny1: y1, nx2: x2, ny2: y2, nwidthX: x2 - offsetX, nheightY: heightY };
        default:
            return null; //should not really get here...
    }
};

export default function artboard() {

    let restoreArray = []
    let arrayIndex = -1

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
    const [penOpen, setPenOpen] = UseState(false)
    const [eraseOpen, setEraseOpen] = UseState(false)
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

        elements.forEach((imageElement) => {
            const { image, x1, y1, widthX, heightY } = imageElement
            contextRef.current.drawImage(image, x1, y1, widthX, heightY);
        });
    }, [elements])

    const createElement = (id, x1, y1, x2, y2, type, image, widthX, heightY) => {
        clearCanvas()
        contextRef.current.drawImage(image, x1, y1, widthX, heightY);
        return { id, x1, y1, x2, y2, type, image, widthX, heightY };
    }

    const updateElement = (id, x1, y1, x2, y2, type, image, widthX, heightY) => {
        console.log("updating element")
        const updatedElement = createElement(id, x1, y1, x2, y2, type, image, widthX, heightY);
        console.log(updatedElement)
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
        const { offsetX, offsetY } = nativeEvent;
        if (tool === "selection") {
            const element = getElementAtPosition(offsetX, offsetY, elements);
            if (element) {
                const clientX = offsetX - element.x1;
                const clientY = offsetY - element.y1;
                setSelectedElement({ ...element, clientX, clientY });

                if (element.position === "inside") {
                    setAction("moving");
                } else {
                    setAction("resizing");
                }
            }
        } else {
            contextRef.current.beginPath();
            contextRef.current.moveTo(offsetX, offsetY);
            setIsDrawing(true);
        }
    };

    const draw = ({ nativeEvent }) => {

        const { offsetX, offsetY } = nativeEvent;
        if (tool === "selection") {
            const element = getElementAtPosition(offsetX, offsetY, elements);
            console.log("selected element : ", element)
            nativeEvent.target.style.cursor = element ? cursorForPosition(element.position) : "default";
        }

        if (action === "moving") {
            const { id, x1, x2, y1, y2, type, clientX, clientY, image, widthX, heightY } = selectedElement;
            const width = x2 - x1;
            const height = y2 - y1;
            const newX1 = offsetX - clientX;
            const newY1 = offsetY - clientY;
            console.log("moving : ", id, newX1, newY1, newX1 + width, newY1 + height, type, image, widthX, heightY)
            updateElement(id, newX1, newY1, newX1 + width, newY1 + height, type, image, widthX, heightY);
        } else if (action === "resizing") {
            const { id, type, position, x1, y1, x2, y2, image, widthX, heightY } = selectedElement;
            console.log("selected values", id, type, position, x1, y1, x2, y2, image, widthX, heightY)
            const { nx1, ny1, nx2, ny2, nwidthX, nheightY } = resizedCoordinates(offsetX, offsetY, position, x1, y1, x2, y2, widthX, heightY);
            console.log("selected return values", nx1, ny1, nx2, ny2, nwidthX, nheightY)
            updateElement(id, nx1, ny1, nx2, ny2, type, image, nwidthX, nheightY);
            console.log("resizing")
        }

        if (!isDrawing) {
            return;
        }
        contextRef.current.lineTo(offsetX, offsetY);
        contextRef.current.stroke();

    };

    const finishDrawing = () => {
        const canvas = canvasRef.current;

        // if (selectedElement) {
        //     const index = selectedElement.id;
        //     const { id, type } = elements[index];
        //     if (action === "drawing" || action === "resizing") {
        //         const { x1, y1, x2, y2, image, widthX, heightY } = adjustElementCoordinates(elements[index]);
        //         updateElement(id, x1, y1, x2, y2, type, image, widthX, heightY);
        //     }
        // }

        setAction("none");
        setSelectedElement(null);
        contextRef.current.closePath();
        console.log(canvas.height, canvas.width)
        restoreArray.push(contextRef.current.getImageData(0, 0, canvas.width, canvas.height))
        arrayIndex += 1
        console.log("restoreArray ", restoreArray)
        setIsDrawing(false);
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
        setTool('line')

        const pencilMore = document.getElementById('pencil')
        const eraserMore = document.getElementById('eraser')
        pencilMore.style.display = "block"
        eraserMore.style.display = "none"

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
                const element = createElement(id, 100, 100, myImage.width * 0.5 + 100, myImage.height * 0.5 + 100, "img", myImage, myImage.width * 0.5, myImage.height * 0.5);
                setElements(prevState => [...prevState, element]);
                setSelectedElement(element);
                // contextRef.current.drawImage(myImage, 100, 100, myImage.width * 0.5, myImage.height * 0.5); // Draws the image on canvas
                // let imgData = contextRef.current.toDataURL("image/jpeg", 0.75);
            }
        }
    }

    const selectErase = () => {
        setPencil({ ...pencil, color: 'white', width: '5' })
        const pencilMore = document.getElementById('pencil')
        const eraserMore = document.getElementById('eraser')
        pencilMore.style.display = "none"
        eraserMore.style.display = "block"
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

    console.log(selectedElement)

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
            <div className="pen-style-open" id="pencil">
                <FaCaretSquareRight onClick={() => setPenOpen(!penOpen)} />
                <div className={penOpen ? "pen-menu-open" : "pen-menu-close"}>
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
            </div>
            <div className="erase-style-open" id="eraser">
                <FaCaretSquareRight onClick={() => setEraseOpen(!eraseOpen)} />
                <div className={eraseOpen ? "pen-menu-open" : "pen-menu-close"}>
                    <div className="pen-width">
                        <p className="pen-width-view">{pencil.width}</p>
                        <input
                            id="typeinp"
                            type="range"
                            min="0"
                            max="20"
                            step="2"
                            defaultValue="6"
                            onChange={(e) => setPencil({ ...pencil, width: e.target.value })}
                        />
                    </div>
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
