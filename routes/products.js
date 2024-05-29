const { Product } = require('../models/product');
const express = require('express');
const { Category } = require('../models/category');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const fs = require('fs')

const FILE_TYPE_MAP ={
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg',
    'image/png': 'png'
}
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isvalid = FILE_TYPE_MAP[file.mimetype];
    let uploadError = new Error('image type is invalid');
    
    if(isvalid){
        uploadError =null
    }
    cb(uploadError, 'public/uploads');
  },
  filename: function (req, file, cb) {
    const fileName = file.originalname.split(' ').join('_'); // or .replace(' ', '_')
    const extension = FILE_TYPE_MAP[file.mimetype];
    cb(null, `${fileName}-${Date.now()}${extension}` );
  }
});

const uploadOption = multer({ storage: storage });

router.get(`/`, async (req, res) => {
  let filter = {};
  if (req.query.categories) {
    filter = { category: req.query.categories.split(',') };
  }

  const productList = await Product.find(filter).populate('category');

  if (!productList) {
    res.status(500).json({ success: false });
  }
  res.send(productList);
});

router.get(`/:id`, async (req, res) => {
  const product = await Product.findById(req.params.id).populate('category');

  if (!product) {
    res.status(500).json({ success: false });
  }
  res.send(product);
});

router.post(`/`, uploadOption.single('image'), async (req, res) => {
  try {
    const file = (req.file); // Log the file object
    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }
  

    const category = await Category.findById(req.body.category);
    if (!category) return res.status(400).send('Invalid Category');

    const fileName = req.file.filename;
    const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;

    let product = new Product({
      name: req.body.name,
      description: req.body.description,
      richDescription: req.body.richDescription,
      image: `${basePath}${fileName}`,
      brand: req.body.brand,
      price: req.body.price,
      category: req.body.category,
      countInStock: req.body.countInStock,
      rating: req.body.rating,
      numReviews: req.body.numReviews,
      isFeatured: req.body.isFeatured,
    });

    product = await product.save();

    if (!product)
      return res.status(500).send('The product cannot be created');

    res.send(product);
    
  }catch (err) {
    res.status(500).send('An error occurred during the file upload.');
    console.error(err);
  }
});
   
router.put('/:id',  uploadOption.single('image'), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).send('Invalid Product Id');
  }
  const category = await Category.findById(req.body.category);
  if (!category) return res.status(400).send('Invalid Category');
  
  const product = await Category.findById(req.body.product);
  if (!product) return res.status(400).send('Invalid Product');

  const file = (req.file);
  let imagepath;
    if (file) {
        const fileName = req.file.filename;
        const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
        imagepath = `${fileName}${basePath}`
    }else{
        imagepath = product.image
    }
  

  const updatedProduct = await Product.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      description: req.body.description,
      richDescription: req.body.richDescription,
      image: imagepath,
      brand: req.body.brand,
      price: req.body.price,
      category: req.body.category,
      countInStock: req.body.countInStock,
      rating: req.body.rating,
      numReviews: req.body.numReviews,
      isFeatured: req.body.isFeatured,
    },
    { new: true }
  );

  if (!updatedProduct)
    return res.status(500).send('The product cannot be updated!');

  res.send(updatedProduct);
  
});

router.delete('/:id', (req, res) => {
  Product.findByIdAndRemove(req.params.id)
    .then((product) => {
      if (product) {
        return res.status(200).json({ success: true, message: 'The product is deleted!' });
      } else {
        return res.status(404).json({ success: false, message: 'Product not found!' });
      }
    })
    .catch((err) => {
      return res.status(500).json({ success: false, error: err });
    });
});

router.get(`/get/count`, async (req, res) => {
  const productCount = await Product.countDocuments((count) => count);

  if (!productCount) {
    res.status(500).json({ success: false });
  }
  res.send({
    productCount: productCount,
  });
});

router.get(`/get/featured/:count`, async (req, res) => {
  const count = req.params.count ? req.params.count : 0;
  const products = await Product.find({ isFeatured: true }).limit(+count);

  if (!products) {
    res.status(500).json({ success: false });
  }
  res.send(products);
});

router.put('/gallery-images/:id',  uploadOption.array('images', 10), async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).send('Invalid Product Id');   
      }   
      const files = (req.files);
      console.log(files);  
      let imagespath =[];
      const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
        if (files) {
            files.map(file=>{imagespath.push(`${basePath}${file.filename}`)})
        }
        
  
      const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        {
          images : imagespath    
        },      
        { new: true }
      );
    
      if (!updatedProduct)
        return res.status(500).send('The product cannot be updated!');
    
      res.send(updatedProduct);
    });


module.exports = router;
