# Deploy, Banco e Acesso Admin

## Banco de dados

O projeto já aponta para este Supabase:

- Projeto: `fgjozrjhgdnsiqbtjdpw`
- URL: `https://fgjozrjhgdnsiqbtjdpw.supabase.co`
- Dashboard: https://supabase.com/dashboard/project/fgjozrjhgdnsiqbtjdpw
- Tabelas principais: `appointments`, `services`, `user_roles`, `profiles`, `admin_access_requests`

Para acessar o banco, entre no Supabase com o email dono do projeto e abra **Table Editor**. O botão **Banco de dados** no painel admin também direciona para esse dashboard.

## Variáveis obrigatórias

No ambiente de produção, configure:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `FROM_EMAIL`
- `ADMIN_APPROVAL_EMAIL=luiznovakiresner228@gmail.com`
- `APP_PUBLIC_URL`
- `VITE_CLIENTS_SPREADSHEET_URL` se quiser abrir uma planilha Google fixa pelo painel

Nunca coloque `SUPABASE_SERVICE_ROLE_KEY` em código público. Ela deve ficar somente nas secrets do Supabase/functions/deploy.

## Aprovação de acesso ao painel admin

Fluxo implementado:

1. A pessoa cria conta em `/login`.
2. O app chama a função `request-admin-access`.
3. Um email chega em `luiznovakiresner228@gmail.com` com links de aprovar ou recusar.
4. Se aprovar, a função `review-admin-request` adiciona o papel `admin` em `user_roles`.
5. Se recusar, o status fica `rejected` e a pessoa continua sem acesso.

## Lembrete automático às 6h

Fluxo implementado:

1. A função `send-appointment-reminders` busca agendamentos do dia em `pending` ou `confirmed`.
2. Envia email ao cliente pedindo confirmação.
3. Marca `reminder_sent_at` para não enviar duplicado.
4. O botão do email chama `confirm-appointment`, que marca `customer_confirmed_at` e status `confirmed`.

Agende a função no Supabase para rodar todo dia às 06:00 no horário de São Paulo. Em UTC, isso é 09:00:

```bash
supabase functions deploy request-admin-access
supabase functions deploy review-admin-request
supabase functions deploy send-appointment-reminders
supabase functions deploy confirm-appointment
supabase secrets set RESEND_API_KEY="re_xxxxxxxxx"
supabase secrets set FROM_EMAIL="MR Odontologia <contato@seudominio.com>"
supabase secrets set ADMIN_APPROVAL_EMAIL="luiznovakiresner228@gmail.com"
supabase secrets set APP_PUBLIC_URL="https://seudominio.com"
```

No painel Supabase, crie um scheduled job/cron para chamar:

```text
https://fgjozrjhgdnsiqbtjdpw.supabase.co/functions/v1/send-appointment-reminders
```

Cron UTC:

```text
0 9 * * *
```

## Tirar do local

Para acessar de qualquer dispositivo, faça deploy do app em Vercel, Netlify, Cloudflare Pages ou Lovable. O mais importante é configurar as mesmas variáveis de ambiente no provedor e colocar a URL final em `APP_PUBLIC_URL`.

Depois do deploy:

1. Abra a URL pública no celular/computador.
2. Crie uma conta admin em `/login`.
3. Aprove pelo email recebido em `luiznovakiresner228@gmail.com`.
4. Entre em `/admin`.
