import './App.css';
import { useEffect } from "react";
import  { BrowserRouter, Routes, Route, useLocation } from "react-router";
import Login from "./Components/Login/Login";
import Register from "./Components/Register/Register";
import Home from './Components/Home/Home';
import Perfil from './Components/Perfil/Perfil';
import Detalhe from './Components/Detalhe/Detalhe';
import Recomendacoes from './Components/Recomendacoes/Recomendacoes';
import MinhaInstituicao from './Components/Instituicao/MinhaInstituicao';
import FormConteudo from './Components/Instituicao/FormConteudo';
import Moderacao from './Components/Admin/Moderacao';
import GerenciarTags from './Components/Admin/GerenciarTags';

// Sempre que muda de página, volta para o topo
function VoltarAoTopo() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  return (
    <div className='App'>
      <BrowserRouter>
        <VoltarAoTopo/>
        <Routes>
          <Route path="/login" element={<Login/>}/>

          <Route path="/register" element={<Register/>}/>

          <Route path="/" element={<Home/>}/>

          <Route path="/perfil" element={<Perfil/>}/>

          <Route path="/conteudo/:id" element={<Detalhe/>}/>

          <Route path="/recomendacoes" element={<Recomendacoes/>}/>

          {/* Área da instituição */}
          <Route path="/instituicao" element={<MinhaInstituicao/>}/>

          <Route path="/instituicao/novo" element={<FormConteudo/>}/>

          <Route path="/instituicao/editar/:id" element={<FormConteudo/>}/>

          {/* Área do administrador */}
          <Route path="/admin" element={<Moderacao/>}/>

          <Route path="/admin/tags" element={<GerenciarTags/>}/>

          <Route path="/admin/editar/:id" element={<FormConteudo modo="admin"/>}/>
        </Routes>
      </BrowserRouter>
    </div>
    
  )
}

export default App;
