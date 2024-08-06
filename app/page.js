'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Button } from '@mui/material';
import AuthModal from './components/AuthModal';
import CategoryGrid from './components/CategoryGrid';
import { updateInventory } from './components/Inventory';
import { firestore, auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

export default function Home() {
  const [inventory, setInventory] = useState([]);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [user, setUser] = useState(null);

  const categoryItems = {
    Groceries: [
      { name: 'Apple', quantity: 1 },
      { name: 'Banana', quantity: 1 },
      // Add more items
    ],
    Electronics: [
      { name: 'Phone', quantity: 1 },
      { name: 'Laptop', quantity: 1 },
      // Add more items
    ],
    'Baby Products': [
      { name: 'Diapers', quantity: 1 },
      { name: 'Milk', quantity: 1 },
      // Add more items
    ],
    'Gift Cards': [
      { name: 'Amazon', quantity: 1 },
      { name: 'iTunes', quantity: 1 },
      // Add more items
    ],
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        updateInventory(setInventory);
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const toggleAuthModal = () => setAuthModalOpen(!authModalOpen);
  const toggleExplore = () => setExploreOpen(!exploreOpen);
  const switchAuthMode = () => setIsLogin(!isLogin);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out: ', error.message);
    }
  };

  return (
    <Box
      sx={{
        backgroundImage: 'url(./pantry9.jpeg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        position: 'relative',
      }}
    >
      <Button
        variant="contained"
        sx={{ position: 'absolute', top: 16, right: 16 }}
        onClick={user ? handleLogout : toggleAuthModal}
      >
        {user ? 'Logout' : 'Login'}
      </Button>

      <Typography variant="h1" color="black" textAlign="center">
        Pantry Tracker
      </Typography>

      <Button
        variant="contained"
        onClick={toggleExplore}
        disabled={!user} // Disable the button if no user is logged in
      >
        Get Started
      </Button>

      {exploreOpen && user && (
        <CategoryGrid
          categories={Object.keys(categoryItems)}
          categoryItems={categoryItems}
          addItem={(item, category) => addItem(item, category, () => updateInventory(setInventory))}
          removeItem={(item) => removeItem(item, () => updateInventory(setInventory))}
        />
      )}

      <AuthModal
        open={authModalOpen}
        onClose={toggleAuthModal}
        isLogin={isLogin}
        toggleMode={switchAuthMode}
        onSuccess={() => {
          toggleAuthModal();
          updateInventory(setInventory);
        }}
      />
    </Box>
  );
}
