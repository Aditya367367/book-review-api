const dbPromise = require('../db');

// Add a New Book
exports.addBook = async (req, res) => {
  const { title, author, genre } = req.body;
  if (!title || !author || !genre) {
    return res.status(400).json({ error: 'Title, author, and genre are required' });
  }

  try {
    const db = await dbPromise;
    await db.run(
      'INSERT INTO books (title, author, genre) VALUES (?, ?, ?)',
      [title, author, genre]
    );
    res.status(201).json({ message: 'Book added successfully' });
  } catch (error) {
    console.error('DB Error:', error.message);
    res.status(500).json({ error: 'Error adding book' });
  }
};

// Get All Books with Filters and Pagination
exports.getAllBooks = async (req, res) => {
  const { author, genre, search, page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const db = await dbPromise;
    let query = 'SELECT * FROM books';
    let conditions = [];
    let params = [];

    if (author) {
      conditions.push('author LIKE ?');
      params.push(`%${author}%`);
    }

    if (genre) {
      conditions.push('genre LIKE ?');
      params.push(`%${genre}%`);
    }

    if (search) {
      conditions.push('(LOWER(title) LIKE ? OR LOWER(author) LIKE ?)');
      params.push(`%${search.toLowerCase()}%`, `%${search.toLowerCase()}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const books = await db.all(query, params);
    res.status(200).json(books);
  } catch (error) {
    console.error('DB Error:', error.message);
    res.status(500).json({ error: 'Error retrieving books' });
  }
};

// Get a Book by ID with Avg Rating and Paginated Reviews
exports.getBookById = async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 5 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const db = await dbPromise;
    const book = await db.get('SELECT * FROM books WHERE id = ?', [id]);
    if (!book) return res.status(404).json({ error: 'Book not found' });

    const avgRow = await db.get(
      'SELECT AVG(rating) as averageRating FROM reviews WHERE book_id = ?',
      [id]
    );
    const averageRating = avgRow.averageRating
      ? parseFloat(avgRow.averageRating).toFixed(1)
      : null;

    const reviews = await db.all(
      `SELECT r.comment, r.rating, u.username 
       FROM reviews r 
       JOIN users u ON r.user_id = u.id 
       WHERE r.book_id = ? 
       ORDER BY r.id DESC 
       LIMIT ? OFFSET ?`,
      [id, limit, offset]
    );

    res.status(200).json({
      book,
      averageRating: averageRating ? `${averageRating}/10` : 'No ratings yet',
      reviews,
    });
  } catch (error) {
    console.error('DB Error:', error.message);
    res.status(500).json({ error: 'Error retrieving book details' });
  }
};

// Submit Review (one per user per book)
exports.submitReview = async (req, res) => {
  const { rating, comment } = req.body;
  const { bookId } = req.params;
  const userId = req.user?.id;

  if (!bookId) return res.status(400).json({ error: 'Book ID is required in URL' });
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  if (rating === undefined || rating < 0 || rating > 10)
    return res.status(400).json({ error: 'Rating must be between 0 and 10' });
  if (!comment || comment.trim() === '')
    return res.status(400).json({ error: 'Comment is required' });

  try {
    const db = await dbPromise;

    const existingReview = await db.get(
      'SELECT * FROM reviews WHERE book_id = ? AND user_id = ?',
      [bookId, userId]
    );

    if (existingReview) {
      return res.status(400).json({ error: 'You have already submitted a review for this book' });
    }

    await db.run(
      'INSERT INTO reviews (book_id, user_id, rating, comment) VALUES (?, ?, ?, ?)',
      [bookId, userId, rating, comment]
    );

    res.status(201).json({ message: 'Review submitted successfully' });
  } catch (error) {
    console.error('DB Error:', error.message);
    res.status(500).json({ error: 'Error submitting review' });
  }
};
// Update Review (only by owner)
exports.updateReview = async (req, res) => {
  const { reviewId } = req.params;
  const { rating, comment } = req.body;
  const userId = req.user?.id;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  if (rating === undefined || rating < 0 || rating > 10)
    return res.status(400).json({ error: 'Rating must be between 0 and 10' });

  try {
    const db = await dbPromise;

    const review = await db.get('SELECT * FROM reviews WHERE id = ?', [reviewId]);
    if (!review) return res.status(404).json({ error: 'Review not found' });
    if (review.user_id !== userId)
      return res.status(403).json({ error: 'You can only update your own review' });

    await db.run(
      'UPDATE reviews SET rating = ?, comment = ? WHERE id = ?',
      [rating, comment, reviewId]
    );

    res.status(200).json({ message: 'Review updated successfully' });
  } catch (error) {
    console.error('DB Error:', error.message);
    res.status(500).json({ error: 'Error updating review' });
  }
};

// Delete Review (only by owner)
exports.deleteReview = async (req, res) => {
  const { reviewId } = req.params;
  const userId = req.user?.id;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const db = await dbPromise;

    const review = await db.get('SELECT * FROM reviews WHERE id = ?', [reviewId]);
    if (!review) return res.status(404).json({ error: 'Review not found' });
    if (review.user_id !== userId)
      return res.status(403).json({ error: 'You can only delete your own review' });

    await db.run('DELETE FROM reviews WHERE id = ?', [reviewId]);

    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('DB Error:', error.message);
    res.status(500).json({ error: 'Error deleting review' });
  }
};
