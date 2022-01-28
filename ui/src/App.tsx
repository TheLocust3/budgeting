import React from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from './containers/Login';
import Main from './containers/Main';
import NotFound from './containers/NotFound';
import GlobalStyle from './components/GlobalStyle';
import RequireAuth from './components/RequireAuth';

function App() {
  return (
    <>
      <GlobalStyle />
      
      <BrowserRouter>
        <RequireAuth />

        <Routes>          
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Main />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
