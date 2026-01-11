import React from "react";
import {Routes,Route} from "react-router-dom"
import Home from "./pages/Home";
import ERC721 from "./pages/ERC721";
export default function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Home/>}></Route>
        <Route path='/ERC721' element={<ERC721/>}></Route>
      </Routes>
    </div>
  );
}
