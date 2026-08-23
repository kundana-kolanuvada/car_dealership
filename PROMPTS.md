# AI Prompts

This file contains the prompts used with AI tools during the development of the AutoElite Car Dealership Inventory System.

AI Tools Used:
- ChatGPT
- Claude
- OpenAI Codex

---

## ChatGPT Prompts

### 1. Project Planning

I need to build a full-stack Car Dealership Inventory System following a TDD approach. Help me plan the project architecture, folder structure, backend APIs, database schema, frontend structure, authentication flow, and testing strategy using Node.js, TypeScript, Express.js, React, Prisma, and SQLite.

### 2. Backend Setup

Help me set up the backend for a Car Dealership Inventory System using Node.js, TypeScript, Express.js, Prisma, and SQLite. Provide a clean and maintainable folder structure following good software design practices.

### 3. Database Design

Design a Prisma database schema for a car dealership inventory system. Each vehicle should have a unique ID, make, model, category, price, and quantity in stock. Users should support authentication and admin/customer roles.

### 4. Authentication

Implement user registration and login for my Node.js TypeScript Express backend using bcrypt for password hashing and JWT for token-based authentication. Include validation, error handling, and authentication middleware.

### 5. Vehicle APIs

Help me implement REST APIs for the vehicle inventory system:
POST /api/vehicles
GET /api/vehicles
GET /api/vehicles/search
PUT /api/vehicles/:id
DELETE /api/vehicles/:id

The APIs should include authentication and admin authorization where required.


### 6. Purchase Functionality

Implement a vehicle purchase API for my car dealership application. The endpoint should decrease the vehicle quantity when a purchase is made, prevent purchases when the quantity is zero, validate the vehicle, and use a database transaction to maintain consistency.


### 7. Restock Functionality

Implement an admin-only restock API for the car dealership system. The endpoint should increase the vehicle quantity and validate the vehicle ID and restock quantity.

### 8. TDD Tests

Help me write tests following the Red-Green-Refactor TDD approach for the authentication, vehicle management, purchase, restock, authorization, and stock validation functionality of my Express TypeScript backend.

### 9. Debugging

I am getting the following error in my Node.js TypeScript backend. Analyze the error, identify the root cause, and suggest a fix without changing unrelated parts of the application.


### 10. Frontend Development

Help me build the React frontend for my Car Dealership Inventory System. I need registration and login forms, a vehicle dashboard, vehicle search and filtering, purchase functionality, and admin forms for adding, updating, deleting, and restocking vehicles.

### 11. UI Improvement

Improve the UI of my React car dealership application using HTML5, CSS3, Tailwind CSS, and React. Make the interface modern, responsive, user-friendly, and suitable for a professional dealership application.

### 12. Test Failure Analysis

Analyze the following test failures from my car dealership backend. Explain why the tests are failing and provide the minimum changes required to fix the issues while preserving the existing functionality.


---

## Claude Prompts

### 1. Architecture Review

Review the architecture of my Car Dealership Inventory System built with React, TypeScript, Node.js, Express.js, Prisma, and SQLite. Identify potential design issues and suggest improvements for maintainability and scalability.

### 2. Backend Review

Review my Express.js and TypeScript backend for authentication, authorization, API design, validation, error handling, and database operations. Suggest improvements while keeping the existing project structure.

### 3. Frontend Review

Review my React frontend for component structure, state management, API integration, error handling, responsiveness, and user experience. Suggest practical improvements.

### 4. Debugging

Analyze this error from my Car Dealership Inventory System and determine the root cause. Provide a clear explanation and a minimal fix.

---

## OpenAI Codex Prompts

### 1. Feature Implementation

Implement the following feature in my existing Car Dealership Inventory System. Follow the existing project structure and coding conventions. Do not modify unrelated functionality.

### 2. Test Implementation

Add tests for the following functionality using the existing testing framework and project conventions. Cover both successful and failure scenarios.

### 3. Bug Fix

Investigate and fix the following bug in my existing project. First identify the likely cause, then make the smallest necessary code changes while preserving existing behavior.
