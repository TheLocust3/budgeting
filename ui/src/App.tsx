import React from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from './containers/Login';
import NotFound from './containers/NotFound';
import GlobalStyle from './components/GlobalStyle';
import RequireAuth from './components/RequireAuth';

function App() {
  return (
    <div>
      <GlobalStyle />
      
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <RequireAuth>
            <Route path="*" element={<NotFound />} />
          </RequireAuth>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
