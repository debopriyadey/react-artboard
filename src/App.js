import React, { useEffect, useState, useRef } from 'react'

import { FaDownload, FaUndo, FaPenAlt } from 'react-icons/fa';
import { IoMdCloseCircle, IoMdColorPalette } from 'react-icons/io'
import Artboard from './artboard';
import Notes from './notes';
import './App.css'
import ItemDetails from './itemDetails';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import { IconButton } from '@mui/material';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 1400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

function App() {
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <div>
      <div className="artboard-btn-container">
        <Button onClick={handleOpen} variant="contained" className="artboard-btn">Item Design</Button>
        <Modal
          open={open}
          onClose={handleClose}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
        >
          <Box sx={style}>
            <IconButton className="artboard-close-btn">
              <IoMdCloseCircle onClick={handleClose} />
            </IconButton>
            <div className="m-3">
              <div className="row">
                <ItemDetails />
              </div>
              <div className="row">
                <div className="col-12">
                  <Artboard />
                </div>
                {/* <div className="col-3">
                  <Notes />
                </div> */}
              </div>
            </div>
          </Box>
        </Modal>
      </div>
    </div>
  );
}

// function App() {

//   return (
//     <>

//       <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#staticBackdrop">
//         Launch static backdrop modal
//       </button>

//       <div class="modal fade" id="staticBackdrop" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
//         <div className="m-3">
//           <div className="row">
//             <ItemDetails />
//           </div>
//           <div className="row">
//             <div className="col-9">
//               <Artboard />
//             </div>
//             <div className="col-3">
//               <Notes />
//             </div>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }

export default App;