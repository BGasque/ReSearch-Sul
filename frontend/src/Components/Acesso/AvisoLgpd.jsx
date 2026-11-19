import { ShieldCheck } from "lucide-react";
import { Link } from "react-router";

// Aviso curto sobre a Lei Geral de Proteção de Dados (LGPD), mostrado no login e no cadastro.
const AvisoLgpd = () => (
    <aside className="aviso-lgpd">
        <span className="aviso-lgpd-icone"><ShieldCheck className="icon"/></span>
        <div>
            <p className="aviso-lgpd-titulo">Seus dados estão protegidos pela LGPD</p>
            <p>
                O ReSearch Sul usa seu nome, seu e-mail e, se você quiser, seu Currículo Lattes
                e seus interesses só para o site funcionar:
                entrar na conta, mostrar o perfil e recomendar eventos.
                A senha é guardada criptografada, e nenhum dado é vendido ou passado para outras empresas.
            </p>
            <p>
                Pela Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você pode pedir para ver,
                corrigir, baixar ou apagar seus dados quando quiser, na parte "Meus dados" do seu perfil.
            </p>
            <p><Link to="/termos#privacidade">Ler a Política de privacidade completa</Link></p>
        </div>
    </aside>
);

export default AvisoLgpd;
