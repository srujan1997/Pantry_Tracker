// src/app/components/InventoryDetails.js

import React, { useEffect, useState } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TablePagination, Button, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import { firestore } from '../firebase'; 

const ITEMS_PER_PAGE = 10;

const InventoryDetails = ({ open, onClose }) => {
  const [inventory, setInventory] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(ITEMS_PER_PAGE);

  useEffect(() => {
    if (open) {
      fetchInventoryDetails();
    }
  }, [open]);

  const fetchInventoryDetails = async () => {
    const inventoryData = [];
    const categoriesRef = collection(firestore, 'categories');

    try {
      const categoriesSnapshot = await getDocs(categoriesRef);

      for (const doc of categoriesSnapshot.docs) {
        const itemsRef = collection(doc.ref, 'items');
        const itemsSnapshot = await getDocs(itemsRef);

        itemsSnapshot.forEach((itemDoc) => {
          const itemData = itemDoc.data();
          inventoryData.push({
            id: itemDoc.id, // Add document ID
            name: itemData.name,
            category: doc.id,
            quantity: itemData.quantity || 0,
          });
        });
      }

      setInventory(inventoryData);
    } catch (error) {
      console.error('Error fetching inventory details:', error);
    }
  };

  const handleDelete = async (id, category) => {
    try {
      const itemRef = doc(collection(firestore, 'categories', category, 'items'), id);
      await deleteDoc(itemRef);
      console.log('Item deleted from Firestore:', id);
      
      // Refresh the inventory details after deletion
      fetchInventoryDetails();
    } catch (error) {
      console.error('Error deleting item from Firestore:', error);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box
      sx={{
        display: open ? 'block' : 'none',
        position: 'fixed',
        top: 0,
        right: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1200,
        overflowY: 'auto',
        p: 2,
      }}
    >
      <Box
        sx={{
          backgroundColor: 'white',
          p: 2,
          borderRadius: 1,
          maxWidth: '600px',
          margin: 'auto',
        }}
      >
        <Button onClick={onClose}>Close</Button>
        <Typography variant="h6">Inventory Details</Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {inventory
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleDelete(item.id, item.category)}>
                        <DeleteIcon color="error" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[ITEMS_PER_PAGE]}
          component="div"
          count={inventory.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Box>
    </Box>
  );
};

export default InventoryDetails;
