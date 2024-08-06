import React, { useState, useEffect } from 'react';
import { Box, Button, Stack, Typography, MenuItem, Select, InputLabel, FormControl, TextField, IconButton, Drawer, Snackbar, Alert, CssBaseline, Tab, Tabs } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc } from "firebase/firestore";
import { itemsData } from '../data/items';
import { firestore, auth } from '../firebase'; 
import InventoryDetails from './InventoryDetails'; 
import MyInventory from './MyInventory';

const ITEMS_PER_PAGE = 5;

const CategoryGrid = () => {
  const [categories, setCategories] = useState(['Apparel', 'SportsGear', 'DairyProducts']);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState({});
  const [cartOpen, setCartOpen] = useState(false);
  const [quantities, setQuantities] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [myInventoryOpen, setMyInventoryOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [userInventory, setUserInventory] = useState([]);

  useEffect(() => {
    if (selectedCategory) {
      setItems(itemsData[selectedCategory]);
      setCurrentPage(1); // Reset to the first page whenever the category changes
    }
  }, [selectedCategory]);

  const handleSearch = (itemName) => {
    return itemName.toLowerCase().includes(searchTerm.toLowerCase());
  };

  const handleAddToCart = async (item, quantity) => {
    if (quantity > 0) {
      try {
        const user = auth.currentUser;
        if (!user) {
          throw new Error('User not authenticated');
        }
        const itemRef = doc(collection(firestore, 'categories', selectedCategory, 'items'), item);
        const userItemRef = doc(collection(firestore, 'users', user.uid, 'items'), item);
        const itemSnap = await getDoc(itemRef);
        const currentQuantity = itemSnap.exists() ? itemSnap.data().quantity : 0;
        const newQuantity = currentQuantity + quantity;

        await setDoc(itemRef, { name: item, quantity: newQuantity }, { merge: true });
        await setDoc(userItemRef, { name: item, quantity: newQuantity, category: selectedCategory }, { merge: true });

        console.log('Item added to Firestore:', item, newQuantity);

        // Display success message
        setSnackbarMessage(`Successfully added ${quantity} ${item}(s) to inventory`);
        setSnackbarOpen(true);

        // Reset quantity back to 0
        setQuantities(prevQuantities => ({
          ...prevQuantities,
          [item]: 0,
        }));

        // Fetch total quantity and update state
        setCart(prevCart => ({
          ...prevCart,
          [item]: newQuantity,
        }));

      } catch (error) {
        console.error('Error adding item to Firestore:', error);
      }
    }
  };

  const handleRemoveFromCart = (item) => {
    setCart(prevCart => {
      const { [item]: _, ...rest } = prevCart;
      return rest;
    });
  };

  const handleQuantityChange = (item, change) => {
    setQuantities(prevQuantities => ({
      ...prevQuantities,
      [item]: Math.max((prevQuantities[item] || 0) + change, 0),
    }));
  };

  const toggleCart = () => setCartOpen(!cartOpen);

  const handleNextPage = () => {
    if (currentPage < Math.ceil(items.length / ITEMS_PER_PAGE)) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const paginatedItems = items
    .filter(item => handleSearch(item.name))
    .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const fetchUserInventory = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const userInventoryRef = collection(firestore, 'users', user.uid, 'items');
      const querySnapshot = await getDocs(userInventoryRef);
      const inventoryData = [];
      querySnapshot.forEach((doc) => {
        inventoryData.push({ id: doc.id, ...doc.data() });
      });

      setUserInventory(inventoryData);
      setMyInventoryOpen(true);
    } catch (error) {
      console.error('Error fetching user inventory:', error);
    }
  };

  const handleDelete = async (item) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const userItemRef = doc(collection(firestore, 'users', user.uid, 'items'), item.id);
      const itemRef = doc(collection(firestore, 'categories', item.category, 'items'), item.id);

      // Remove the item from the user's inventory
      await deleteDoc(userItemRef);

      // Update the global count
      const itemSnap = await getDoc(itemRef);
      if (itemSnap.exists()) {
        const currentQuantity = itemSnap.data().quantity;
        const newQuantity = currentQuantity - item.quantity;
        if (newQuantity > 0) {
          await updateDoc(itemRef, { quantity: newQuantity });
        } else {
          await deleteDoc(itemRef);
        }
      }

      // Update user inventory state
      setUserInventory(prevInventory => prevInventory.filter(i => i.id !== item.id));

      // Display success message
      setSnackbarMessage(`Successfully deleted ${item.quantity} ${item.name}(s) from your inventory`);
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error deleting item from inventory:', error);
    }
  };

  return (
    <Box>
      <CssBaseline />
      <Tabs value={tabValue} onChange={handleTabChange} aria-label="inventory tabs">
        <Tab label="Category Inventory" />
      </Tabs>

      <Button
        variant="contained"
        onClick={() => setInventoryOpen(true)}
        sx={{
          position: 'fixed',
          top: 16,
          left: 16,
          zIndex: 1200, // Make sure the button is above other content
        }}
      >
        Inventory
      </Button>
      <Button
        variant="contained"
        onClick={fetchUserInventory}
        sx={{
          position: 'fixed',
          top: 16,
          left: 150,
          zIndex: 1200, // Make sure the button is above other content
        }}
      >
        My Inventory
      </Button>

      <Box display="flex" p={2}>
        <Box flexGrow={1}>
          {tabValue === 0 && (
            <Box mt={2}>
              <FormControl fullWidth>
                <InputLabel></InputLabel>
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  displayEmpty
                  fullWidth
                >
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {selectedCategory && (
                <Box mt={2}>
                  <TextField
                    variant="outlined"
                    placeholder="Search items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      endAdornment: <SearchIcon />,
                    }}
                    fullWidth
                    sx={{ maxWidth: '600px' }}
                  />
                  <Stack spacing={2} mt={2}>
                    {paginatedItems.map((item) => (
                      <Box key={item.id} display="flex" alignItems="center" justifyContent="space-between">
                        <Typography variant="body1" sx={{ color: 'black' }}>{item.name}</Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <IconButton onClick={() => handleQuantityChange(item.name, -1)}>
                            <RemoveIcon />
                          </IconButton>
                          <Typography variant="body2">{quantities[item.name] || 0}</Typography>
                          <IconButton onClick={() => handleQuantityChange(item.name, 1)}>
                            <AddIcon />
                          </IconButton>
                        </Stack>
                        <Button
                          variant="contained"
                          onClick={() => handleAddToCart(item.name, quantities[item.name] || 0)}
                        >
                          Add to Inventory
                        </Button>
                      </Box>
                    ))}
                  </Stack>
                  <Box mt={2} display="flex" justifyContent="space-between">
                    <Button onClick={handlePrevPage} disabled={currentPage === 1}>Previous</Button>
                    <Button onClick={handleNextPage} disabled={currentPage >= Math.ceil(items.length / ITEMS_PER_PAGE)}>Next</Button>
                  </Box>
                </Box>
              )}
            </Box>
          )}

          {tabValue === 1 && (
            <MyInventory />
          )}
        </Box>

        <Drawer anchor="right" open={cartOpen} onClose={toggleCart}>
          <Box p={2} width={250}>
            <Typography variant="h6">Inventory</Typography>
            <Stack spacing={2} mt={2}>
              {Object.entries(cart).map(([item, quantity]) => (
                <Box key={item} display="flex" justifyContent="space-between">
                  <Typography>{item}</Typography>
                  <Typography>{quantity}</Typography>
                  <IconButton onClick={() => handleRemoveFromCart(item)}>
                    <RemoveIcon />
                  </IconButton>
                </Box>
              ))}
            </Stack>
          </Box>
        </Drawer>

        <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
          <Alert onClose={handleSnackbarClose} severity="success" sx={{ width: '100%' }}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>

      <InventoryDetails open={inventoryOpen} onClose={() => setInventoryOpen(false)} />

      {/* Drawer for User Inventory */}
      <Drawer anchor="right" open={myInventoryOpen} onClose={() => setMyInventoryOpen(false)}>
        <Box p={2} width={400}>
          <Typography variant="h6">My Inventory</Typography>
          <Stack spacing={2} mt={2}>
            {userInventory.map((item, index) => (
              <Box key={index} display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography>{item.name}</Typography>
                  <Typography>{item.quantity}</Typography>
                </Box>
                <IconButton onClick={() => handleDelete(item)}>
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}
          </Stack>
        </Box>
      </Drawer>
    </Box>
  );
};

export default CategoryGrid;
