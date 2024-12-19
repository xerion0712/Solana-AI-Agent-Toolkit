# How to Setup Locally

Setting up the **Solana Agent Kit** on your local machine involves cloning the repository, installing dependencies, configuring environment variables, and building the project. Follow the steps below to get started.

## Prerequisites

- **Node**: Ensure you have Node version 23.x or higher installed. You can download it from [Node Official Website](https://nodejs.org/).
- **Package Manager**: Node's package manager comes bundled with Node. Verify installation by running `npm -v`.
- **Git**: Ensure Git is installed and configured. Download from [Git Official Website](https://git-scm.com/).

## Step-by-Step Guide

1. **Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/solana-agent-kit.git
   ```

2. **Navigate to the Project Directory**
   ```bash
   cd solana-agent-kit
   ```

3. **Install Dependencies**

   The project uses `pnpm` for package management. Install all necessary dependencies by running:
   ```bash
   pnpm install
   ```

4. **Configure Environment Variables**

   Create a `.env` file in the root directory of the project to store your environment variables securely. This file should include the following variables:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   RPC_URL=your_rpc_url
   SOLANA_PRIVATE_KEY=your_solana_private_key_here
   ```

   - **OPENAI_API_KEY**: Your OpenAI API key for generating images and interacting with OpenAI services.
   - **RPC_URL**: Your RPC_URL for Solana blockchain interactions.
   - **SOLANA_PRIVATE_KEY**: Your Solana wallet's private key in base58 format.

   **Note:** Ensure that the `.env` file is added to `.gitignore` to prevent exposing sensitive information.

5. **Build the Project**

   Compile the TypeScript code to JavaScript using the build script:
   ```bash
   pnpm run build
   ```

   This will generate the compiled files in the `dist/` directory.

6. **Generate Documentation (Optional)**

   If you wish to generate the project documentation, use the following command:
   ```bash
   pnpm run docs
   ```

   The documentation will be available in the `docs/` directory.

---

**Additional Information:**

- **Git Configuration:** Ensure that Git is properly configured with your user name and email. You can set them using:
  ```bash
  git config --global user.name "Your Name"
  git config --global user.email "your.email@example.com"
  ```

- **Verifying Installation:**

  After installing dependencies and building the project, you can verify the installation by running:
  ```bash
  pnpm run build
  pnpm run test
  ```

  Ensure that all tests pass successfully.

--- 