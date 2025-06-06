const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const auth = require('../middleware/auth');

// Route to add a new book (protected)
router.post('/books', auth, bookController.addBook);

// Route to get all books
router.get('/books', bookController.getAllBooks);

// Route to get a book by ID
router.get('/books/:id', bookController.getBookById);

// Route to submit a review for a book (protected)
router.post('/books/:bookId/reviews', auth, bookController.submitReview);

// Route to update a review (protected)
router.put('/books/:bookId/reviews/:reviewId', auth, bookController.updateReview);

// Route to delete a review (protected)
router.delete('/books/:bookId/reviews/:reviewId', auth, bookController.deleteReview);

module.exports = router;