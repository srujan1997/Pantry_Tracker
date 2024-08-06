import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, IconButton, Table, TableBody, TableCell, TableHead, TableRow, Snackbar, Alert, Drawer, TextField } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { collection, doc, getDocs, deleteDoc, updateDoc } from "firebase/firestore";
import { firestore } from '../firebase';

const ITEMS_PER_PAGE = 10;

const MyInventory = ({ open, onClose, userId }) => {
  const [myItems, setMyItems] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    if (open) {
      fetchMyItems();
    }
  }, [open]);

  const fetchMyItems = async () => {
    const userItems = [];
    const categoriesSnapshot = await getDocs(collection(firestore, 'categories'));

    for (const categoryDoc of categoriesSnapshot.docs) {
      const itemsSnapshot = await getDocs(collection(firestore, 'categories', categoryDoc.id, 'items'));
      itemsSnapshot.forEach(itemDoc => {
        if (itemDoc.data().userId === userId) {
          userItems.push({ ...itemDoc.data(), category: categoryDoc.id, id: itemDoc.id });
        }
      });
    }
    
    setMyItems(userItems);
  };

  const handleDelete = async (item) => {
    try {
      const itemRef = doc(firestore, 'categories', item.category, 'items', item.id);
      const itemSnap = await getDoc(itemRef);

      if (itemSnap.exists()) {
        const currentQuantity = itemSnap.data().quantity;
        const newQuantity = currentQuantity - item.quantity;

        if (newQuantity <= 0) {
          await deleteDoc(itemRef);
        } else {
          await updateDoc(itemRef, { quantity: newQuantity });
        }

        await deleteDoc(doc(firestore, 'categories', item.category, 'items', item.id));

        setSnackbarMessage(`Successfully deleted ${item.quantity} ${item.name}(s) from inventory`);
        setSnackbarOpen(true);

        fetchMyItems();
      }
    } catch (error) {
      console.error('Error deleting item from Firestore:', error);
    }
  };

  const handleNextPage = () => {
    if (currentPage < Math.ceil(myItems.length / ITEMS_PER_PAGE)) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const paginatedItems = myItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <Drawer anchor="left" open={open} onClose={onClose}>
      <Box p={2} width={600}>
        <Typography variant="h6">My Inventory</Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleDelete(item)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Box mt={2} display="flex" justifyContent="space-between">
          <Button onClick={handlePrevPage} disabled={currentPage === 1}>Previous</Button>
          <Button onClick={handleNextPage} disabled={currentPage >= Math.ceil(myItems.length / ITEMS_PER_PAGE)}>Next</Button>
        </Box>
      </Box>
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity="success" sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Drawer>
  );
};

export default MyInventory;
