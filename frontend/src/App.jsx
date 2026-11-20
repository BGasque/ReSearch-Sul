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
import GerenciarUsuarios from './Components/Admin/GerenciarUsuarios';
import GerenciarAreas from './Components/Admin/GerenciarAreas';
import GerenciarRelatos from './Components/Admin/GerenciarRelatos';
import Termos from './Components/Termos/Termos';
import EsqueciSenha from './Components/Acesso/EsqueciSenha';
import RedefinirSenha from './Components/Acesso/RedefinirSenha';

// Sempre que muda de página, volta para o topo.
// Se o endereço tiver #parte (ex.: /termos#privacidade), rola até essa parte.
function VoltarAoTopo() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    const parte = hash && document.getElementById(hash.slice(1));
    if (parte) parte.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [pathname, hash]);
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

          <Route path="/esqueci-senha" element={<EsqueciSenha/>}/>

          <Route path="/redefinir-senha" element={<RedefinirSenha/>}/>

          <Route path="/" element={<Home/>}/>

          <Route path="/perfil" element={<Perfil/>}/>

          <Route path="/conteudo/:id" element={<Detalhe/>}/>

          <Route path="/recomendacoes" element={<Recomendacoes/>}/>

          <Route path="/termos" element={<Termos/>}/>

          {/* Área da instituição */}
          <Route path="/instituicao" element={<MinhaInstituicao/>}/>

          <Route path="/instituicao/novo" element={<FormConteudo/>}/>

          <Route path="/instituicao/editar/:id" element={<FormConteudo/>}/>

          {/* Área do administrador */}
          <Route path="/admin" element={<Moderacao/>}/>

          <Route path="/admin/tags" element={<GerenciarTags/>}/>
          <Route path="/admin/usuarios" element={<GerenciarUsuarios/>}/>
          <Route path="/admin/areas" element={<GerenciarAreas/>}/>
          <Route path="/admin/relatos" element={<GerenciarRelatos/>}/>

          <Route path="/admin/editar/:id" element={<FormConteudo modo="admin"/>}/>
        </Routes>
      </BrowserRouter>
    </div>
    
  )
}

export default App;
