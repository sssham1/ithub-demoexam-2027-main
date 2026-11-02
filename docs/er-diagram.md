# ER-диаграмма базы данных «Корочки.есть»

```mermaid
erDiagram
    User ||--o{ Entry : "подает"

    User {
        int id PK
        string login UK "латиница и цифры, от 6 символов"
        string password "хеш scrypt"
        string fullname "кириллица и пробелы"
        string phone "8(XXX)XXX-XX-XX"
        string email
        datetime createdAt
    }

    Entry {
        int id PK
        string course "одна из трех программ"
        date startDate "желаемая дата начала"
        enum payment "CASH | PHONE_TRANSFER"
        enum status "NEW | IN_PROGRESS | DONE"
        string review "отзыв, только при DONE"
        datetime createdAt
        int userId FK
    }
```

Администратор — пользователь с логином `Admin` (пароль `KorokNET`), создается сидом `npm run db:seed`.

Для критерия «ER-диаграмма средствами СУБД» откройте базу `demo` (localhost:5431, postgres/postgres) в pgAdmin или DBeaver и постройте диаграмму по таблицам `User` и `Entry`.
