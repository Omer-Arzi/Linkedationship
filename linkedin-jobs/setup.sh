#!/bin/bash
# One-time setup — run this once before your first scrape
set -e

echo "Creating virtual environment..."
python3 -m venv venv

echo "Activating virtual environment..."
source venv/bin/activate

echo "Installing Python dependencies..."
pip install -r requirements.txt

echo "Installing Playwright's Chromium browser..."
playwright install chromium

echo ""
echo "Setup complete! To run the scraper:"
echo "  source venv/bin/activate"
echo "  python linkedin_jobs.py"
