import "../Acesso/Acesso.css"
import { Link, useNavigate } from "react-router";

//  Integração com o servidor por meio da api
import api from '../../../services/api.js';
import { useState } from "react";
import PainelAcesso from "../Acesso/PainelAcesso.jsx";

const Register = () => {

    const [nome,setNome] = useState('');
    const [email,setEmail] = useState('');
    const [senha,setSenha] = useState('');
    const [tipo,setTipo] = useState('PESSOA');
    const [mensagem,setMensagem] = useState('');

    const navigate = useNavigate();

    async function registerUser(e) {
        e.preventDefault();

        try {
          await api.post('/registerUser',{nome,email,senha,tipo});

          // Cadastro feito: vai para o login
          navigate('/login');
        }catch(error) {
          // Mostra na tela a mensagem que o servidor mandou
          setMensagem(error.response?.data || "Não foi possível criar a conta.");
        }
    }
    return (
    <main className='acesso'>
      <PainelAcesso/>

      <section className="acesso-formulario">
        <form onSubmit={registerUser}>
          <h1>Criar conta</h1>
          <p className="subtitulo">É grátis. Escolha o tipo de conta e preencha os dados.</p>

          <div className="tipo-conta" role="radiogroup" aria-label="Tipo de conta">
            <label className={tipo === 'PESSOA' ? 'marcado' : ''}>
              <input type="radio" name="tipo" value="PESSOA" checked={tipo === 'PESSOA'} onChange={(e) => {setTipo(e.target.value)}}/>
              Estudante ou pesquisador
            </label>
            <label className={tipo === 'INSTITUICAO' ? 'marcado' : ''}>
              <input type="radio" name="tipo" value="INSTITUICAO" checked={tipo === 'INSTITUICAO'} onChange={(e) => {setTipo(e.target.value)}}/>
              Instituição
            </label>
          </div>

          <label className="campo-rotulado">
            <span className="rotulo">{tipo === 'INSTITUICAO' ? 'Nome da instituição' : 'Seu nome'}</span>
            <input type="text" className="campo" value={nome} required onChange={(e) => {setNome(e.target.value)}}/>
          </label>

          <label className="campo-rotulado">
            <span className="rotulo">E-mail</span>
            <input type="email" className="campo" value={email} required onChange={(e) => {setEmail(e.target.value)}}/>
          </label>

          <label className="campo-rotulado">
            <span className="rotulo">Senha (mínimo 6 caracteres)</span>
            <input type="password" className="campo" minLength={6} value={senha} required onChange={(e) => {setSenha(e.target.value)}}/>
          </label>

          {mensagem && <p className="mensagem erro">{mensagem}</p>}

          <button type="submit" className="botao-azul">Criar conta</button>

          <div className="rodape">
            <p>Já tem uma conta? <Link to="/login">Entrar</Link></p>
          </div>
        </form>
      </section>
    </main>
    )
}

export default Register
