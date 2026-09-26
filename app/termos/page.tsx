import type { Metadata } from "next";
import Link from "next/link";
import { EMAIL_CONTATO, PaginaLegal, RESPONSAVEL } from "@/components/pagina-legal";
import { LIMITE_ARQUIVOS_GRATIS, precoFormatado } from "@/lib/planos";
import { MAX_ARQUIVOS_POR_ALBUM } from "@/lib/upload-limits";

export const metadata: Metadata = { title: "Termos de Uso · Enviaí" };

export default function TermosPage() {
  return (
    <PaginaLegal titulo="Termos de Uso" atualizadoEm="26 de setembro de 2026">
      <p>
        Estes termos valem para quem usa o Enviaí, seja como organizador de um evento, seja como convidado que envia
        fotos e vídeos. Ao usar o serviço, você concorda com eles.
      </p>

      <h2>1. O serviço</h2>
      <p>
        O Enviaí permite que o organizador crie um álbum ligado ao próprio Google Drive e compartilhe um link ou QR
        code. Os convidados enviam fotos e vídeos pelo navegador, sem criar conta, e os arquivos são salvos direto na
        pasta do álbum no Drive do organizador. O serviço é oferecido por {RESPONSAVEL}.
      </p>

      <h2>2. Conta do organizador</h2>
      <ul>
        <li>O login é feito com uma conta Google. Você precisa ter pelo menos 18 anos para criar álbuns.</li>
        <li>Você é responsável pelo uso da sua conta e pelos álbuns que criar.</li>
        <li>
          O espaço usado é o do seu Google Drive. Se o Drive ficar sem espaço ou se o acesso for removido, os envios
          param até que a situação seja resolvida.
        </li>
      </ul>

      <h2>3. Responsabilidades do organizador</h2>
      <ul>
        <li>compartilhar o link do álbum apenas com quem deve enviar arquivos;</li>
        <li>usar as fotos e vídeos recebidos de forma respeitosa e de acordo com a lei, incluindo o direito de imagem dos convidados;</li>
        <li>atender pedidos de convidados que queiram remover arquivos em que aparecem.</li>
      </ul>

      <h2>4. Responsabilidades de quem envia</h2>
      <p>Ao enviar arquivos, o convidado declara que tem o direito de compartilhá-los e se compromete a não enviar:</p>
      <ul>
        <li>conteúdo ilegal, violento, de ódio ou de exploração de menores;</li>
        <li>conteúdo íntimo de outra pessoa sem autorização;</li>
        <li>vírus ou arquivos que não sejam fotos e vídeos.</li>
      </ul>

      <h2>5. Limites de uso</h2>
      <p>
        Para manter o serviço estável, há limites de tamanho por arquivo (até 4 GB), de quantidade de arquivos por
        álbum (até {MAX_ARQUIVOS_POR_ALBUM.toLocaleString("pt-BR")}) e de envios seguidos a partir de um mesmo acesso.
        Os limites podem mudar, e avisaremos no site.
      </p>

      <h2>6. Planos, preço e reembolso</h2>
      <p>
        O Enviaí tem um plano grátis e um plano premium, contratado por álbum (por evento), com pagamento único de{" "}
        {precoFormatado()}. O plano grátis permite 1 álbum recebendo arquivos por vez, com até{" "}
        {LIMITE_ARQUIVOS_GRATIS.toLocaleString("pt-BR")} arquivos. O premium do álbum libera até{" "}
        {MAX_ARQUIVOS_POR_ALBUM.toLocaleString("pt-BR")} arquivos, o telão ao vivo e a personalização (cor e capa), e não
        tem mensalidade nem prazo de validade.
      </p>
      <p>
        O pagamento é processado pelo Mercado Pago (Pix, cartão ou boleto), e o premium é liberado automaticamente após a
        confirmação. Você pode desistir da compra em até 7 dias após o pagamento e receber o valor de volta, conforme o
        Código de Defesa do Consumidor: basta escrever para <a href={`mailto:${EMAIL_CONTATO}`}>{EMAIL_CONTATO}</a>. Em
        caso de reembolso, o álbum volta ao plano grátis. Mudanças de preço valem só para novas compras.
      </p>

      <h2>7. Disponibilidade e responsabilidade</h2>
      <ul>
        <li>
          Fazemos o possível para manter o serviço funcionando, mas ele pode ter interrupções, por exemplo em
          manutenções ou falhas de fornecedores como Google e provedores de internet.
        </li>
        <li>
          Os arquivos ficam no Google Drive do organizador. Guardar, fazer cópia de segurança e apagar esses arquivos
          é responsabilidade dele.
        </li>
        <li>
          O Enviaí não revisa o conteúdo enviado pelos convidados e não responde por ele, mas vai agir quando receber
          aviso de conteúdo ilegal.
        </li>
      </ul>

      <h2>8. Suspensão e encerramento</h2>
      <p>
        Podemos suspender álbuns ou contas usados para violar estes termos ou a lei. Você pode parar de usar o Enviaí
        a qualquer momento e excluir a sua conta no painel, em &quot;Sua conta&quot;.
      </p>

      <h2>9. Privacidade</h2>
      <p>
        O tratamento de dados pessoais está descrito na <Link href="/privacidade">Política de Privacidade</Link>.
      </p>

      <h2>10. Alterações e lei aplicável</h2>
      <p>
        Estes termos podem ser atualizados, e a data da última atualização fica no topo da página. Eles seguem as leis
        do Brasil, incluindo o Código de Defesa do Consumidor quando aplicável.
      </p>

      <h2>11. Contato</h2>
      <p>
        Dúvidas, pedidos ou denúncias: <a href={`mailto:${EMAIL_CONTATO}`}>{EMAIL_CONTATO}</a>.
      </p>
    </PaginaLegal>
  );
}
