sudo docker run --rm -w /opt/src -v $(pwd):/opt/src node:8 npm install
sudo docker build -t bmordue/price-for-asin:latest .
