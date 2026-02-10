<p align="center">
  <a href="https://nestjs.com/" target="_blank">
    <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="NestJS Logo" />
  </a>
</p>

<p align="center">
  <strong>EstimApp Backend</strong> – Scalable construction quantity estimation API built with NestJS and PostgreSQL
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@nestjs/core"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
  <a href="https://www.npmjs.com/package/@nestjs/core"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="License" /></a>
  <a href="https://www.npmjs.com/package/@nestjs/core"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="Downloads" /></a>
  <a href="https://discord.gg/G7Qnnhy"><img src="https://img.shields.io/badge/Discord-Online-brightgreen.svg" alt="Discord" /></a>
</p>

---

## **Project Description**

EstimApp is a backend API for construction project estimation, quantity take-offs, and project management. Built with **NestJS**, **Prisma ORM**, and **PostgreSQL**, it includes authentication, project management, BOQ items, material take-off, labor productivity, equipment cost tracking, and email notifications.

The backend is designed to be modular, scalable, and production-ready.

---

## **Tech Stack**

- **Backend Framework:** [NestJS](https://nestjs.com/)  
- **Database:** [PostgreSQL](https://www.postgresql.org/) + [Prisma ORM](https://www.prisma.io/)  
- **Authentication:** JWT  
- **Email Service:** [Nodemailer](https://nodemailer.com/)  
- **Real-Time Features:** Socket.IO  
- **Testing:** Jest  

---

## **Folder Structure**

```text
estimapp-backend/
├─ src/
│  ├─ auth/
│  ├─ users/
│  ├─ project/
│  ├─ boq-items/
│  ├─ material-takeoff/
│  ├─ labor-productivity/
│  ├─ equipment-cost/
│  ├─ common/
│  └─ main.ts
├─ prisma/
│  ├─ migrations/
│  └─ schema.prisma
├─ test/
├─ .env
├─ package.json
└─ README.md
