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
          
          <Route element={<RequireAuth />}>
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
