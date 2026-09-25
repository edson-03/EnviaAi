import type { Metadata } from "next";
import Link from "next/link";
import { EMAIL_CONTATO, PaginaLegal, RESPONSAVEL } from "@/components/pagina-legal";

export const metadata: Metadata = { title: "Política de Privacidade · Enviaí" };

export default function PrivacidadePage() {
  return (
    <PaginaLegal titulo="Política de Privacidade" atualizadoEm="24 de setembro de 2026">
      <p>
        Esta política explica quais dados o Enviaí coleta, para que usa e quais são os seus direitos, de acordo com a
        Lei Geral de Proteção de Dados (Lei nº 13.709/2018, LGPD).
      </p>

      <h2>1. Quem somos</h2>
      <p>
        O Enviaí é um serviço que permite a organizadores de eventos receber fotos e vídeos dos convidados diretamente
        no próprio Google Drive. O responsável pelo serviço é {RESPONSAVEL}, pessoa física, que pode ser contatado pelo
        e-mail <a href={`mailto:${EMAIL_CONTATO}`}>{EMAIL_CONTATO}</a>.
      </p>
      <p>
        Em relação às fotos e vídeos enviados pelos convidados, quem decide o que fazer com eles é o organizador do
        evento, dono do Google Drive onde os arquivos são guardados. O Enviaí apenas viabiliza o envio.
      </p>

      <h2>2. Dados que coletamos</h2>
      <p>
        <strong>Organizador</strong> (quem cria álbuns):
      </p>
      <ul>
        <li>nome, e-mail e foto de perfil da conta Google usada no login;</li>
        <li>tokens de acesso do Google, guardados de forma criptografada, para criar pastas e receber arquivos no seu Drive;</li>
        <li>dados dos álbuns: título, tipo e data do evento.</li>
      </ul>
      <p>
        <strong>Convidado</strong> (quem envia fotos):
      </p>
      <ul>
        <li>nome, se o convidado decidir informar;</li>
        <li>dados técnicos dos arquivos enviados: nome do arquivo, tipo, tamanho e data do envio;</li>
        <li>endereço IP, usado apenas para limitar abusos e apagado automaticamente em cerca de 10 minutos.</li>
      </ul>
      <p>
        <strong>As fotos e vídeos não passam pelos nossos servidores</strong> nem ficam guardados com o Enviaí: eles vão
        do celular do convidado direto para o Google Drive do organizador.
      </p>

      <h2>3. Acesso ao Google Drive</h2>
      <p>
        O Enviaí pede ao Google apenas a permissão <code>drive.file</code>, a mais restrita disponível. Com ela, o Enviaí
        só enxerga as pastas e os arquivos que ele mesmo criou. O restante do seu Drive continua inacessível para nós.
      </p>
      <p>
        Usamos esse acesso somente para criar a pasta de cada álbum, receber os arquivos dos convidados nela, conferir
        que cada arquivo foi salvo na pasta certa e mostrar o espaço livre do seu Drive no painel.
      </p>
      <p>
        O uso e a transferência, para qualquer outro aplicativo, de informações recebidas das APIs do Google pelo
        Enviaí seguem a{" "}
        <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer">
          Política de Dados do Usuário dos Serviços de API do Google
        </a>
        , incluindo os requisitos de Uso Limitado. Não usamos dados do Google para publicidade, não os vendemos e não
        os usamos para treinar modelos de inteligência artificial.
      </p>

      <h2>4. Para que usamos os dados</h2>
      <ul>
        <li>permitir o login e manter a sua sessão (execução do serviço contratado);</li>
        <li>criar álbuns e receber os arquivos no seu Drive (execução do serviço);</li>
        <li>mostrar ao organizador quem enviou cada arquivo, quando o convidado informa o nome (consentimento);</li>
        <li>proteger o serviço contra abuso e envio em massa (legítimo interesse).</li>
      </ul>

      <h2>5. Com quem compartilhamos</h2>
      <p>Não vendemos dados. Usamos os seguintes fornecedores para operar o serviço:</p>
      <ul>
        <li>Google: login e armazenamento dos arquivos no Drive do organizador;</li>
        <li>MongoDB Atlas: banco de dados com as informações dos álbuns e envios;</li>
        <li>Vercel: hospedagem do site.</li>
      </ul>
      <p>
        Esses fornecedores podem manter servidores fora do Brasil. Nesse caso, a transferência segue as garantias
        previstas na LGPD.
      </p>

      <h2>6. Cookies</h2>
      <p>
        Usamos apenas o cookie necessário para manter o organizador conectado. Não usamos cookies de publicidade nem de
        rastreamento. O convidado não recebe cookies de login.
      </p>

      <h2>7. Por quanto tempo guardamos</h2>
      <ul>
        <li>dados da conta e dos álbuns: enquanto a conta existir;</li>
        <li>registros de envios: enquanto o álbum existir;</li>
        <li>endereço IP: cerca de 10 minutos.</li>
      </ul>
      <p>
        Você pode excluir a sua conta e os seus dados a qualquer momento no painel, em &quot;Sua conta&quot;, ou pedir
        pelo e-mail de contato. Os arquivos continuam no seu
        Google Drive, porque pertencem a você. Você também pode remover o acesso do Enviaí a qualquer momento em{" "}
        <a href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer">
          myaccount.google.com/permissions
        </a>
        .
      </p>

      <h2>8. Segurança</h2>
      <p>
        Toda a comunicação usa HTTPS. Os tokens do Google são guardados criptografados, e o navegador nunca tem acesso
        direto ao banco de dados.
      </p>

      <h2>9. Seus direitos</h2>
      <p>
        Pela LGPD, você pode pedir a confirmação e o acesso aos seus dados, a correção, a exclusão, a portabilidade,
        informações sobre compartilhamento e revogar o consentimento. Basta escrever para{" "}
        <a href={`mailto:${EMAIL_CONTATO}`}>{EMAIL_CONTATO}</a>. Você também pode reclamar à Autoridade Nacional de
        Proteção de Dados (ANPD).
      </p>
      <p>
        Se você é convidado e quer que uma foto sua seja removida, fale com o organizador do evento, que é o dono da
        pasta. Se precisar, podemos ajudar a fazer esse contato.
      </p>

      <h2>10. Alterações</h2>
      <p>
        Podemos atualizar esta política. A data da última atualização fica no topo da página. Mudanças importantes
        serão avisadas no site. Veja também os <Link href="/termos">Termos de uso</Link>.
      </p>
    </PaginaLegal>
  );
}
