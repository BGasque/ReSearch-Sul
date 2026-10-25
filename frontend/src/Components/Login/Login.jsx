import { useState } from 'react'
import "../Acesso/Acesso.css"
import { Link, useNavigate } from "react-router";
import api from '../../../services/api.js';
import PainelAcesso from '../Acesso/PainelAcesso.jsx';

const Login = () => {
    const [email,setEmail] = useState('');
    const [senha,setSenha] = useState('');
    const [mensagem,setMensagem] = useState('');

    const navigate = useNavigate();

    async function logUser(e) {
      e.preventDefault();

      try{
        const login = await api.post('/loginUser', {email,senha});

        if (login.status == 200) {
          localStorage.setItem('token',login.data);
          navigate('/');
        }
      }catch(error) {
        // Mostra na tela a mensagem que o servidor mandou
        setMensagem(error.response?.data || "Não foi possível entrar.");
      }
    }

    return (
    <main className='acesso'>
      <PainelAcesso/>

      <section className="acesso-formulario">
        <form onSubmit={logUser}>
          <h1>Entrar</h1>
          <p className="subtitulo">Use o e-mail e a senha da sua conta ReSearch Sul.</p>

          <label className="campo-rotulado">
            <span className="rotulo">E-mail</span>
            <input type="email" className="campo" value={email} required onChange={(e) => {setEmail(e.target.value)}}/>
          </label>

          <label className="campo-rotulado">
            <span className="rotulo">Senha</span>
            <input type="password" className="campo" value={senha} required onChange={(e) => {setSenha(e.target.value)}}/>
          </label>

          {mensagem && <p className="mensagem erro">{mensagem}</p>}

          <button type="submit" className="botao-azul">Entrar</button>

          <div className="rodape">
            <p>Ainda não tem uma conta? <Link to="/register">Crie uma</Link></p>
            <p><Link to="/">Ver o catálogo sem entrar</Link></p>
          </div>
        </form>
      </section>
    </main>
    )
}

export default Login
