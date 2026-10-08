import { Hono } from "hono";

import {
  bookOptionalValidator,
  bookParamValidator,
  bookValidator,
} from "../validators/bookValidator.js";
import {
  createBook,
  deleteBookById,
  getBookById,
  getBooks,
  getBooksByGenre,
  updateBookById,
} from "../database/books.js";

const books = new Hono({ strict: false });

books.get("/", async (c) => {
  try {
    const books = await getBooks({
      maxYear: Number(c.req.query("maxyear")) || undefined,
      author: c.req.query("author"),
      copies: Number(c.req.query("copies")) || undefined,
    });
    return c.json(books);
  } catch (e) {
    console.warn("Error in fetching books from SB database", e);
    return c.json([]);
  }
});

// GET: books either books/genre/fiction/ | books/genre/nonfiction/
// If not neither of those 400
// Filter books based on the genre
// Extra add all previous search filtering from GET: books
books.get("/genre/:genre", bookParamValidator, async (c) => {
  const genre = c.req.valid("param").genre
  try {
    const books = await getBooksByGenre(genre, {
      maxYear: Number(c.req.query("maxyear")) || undefined,
      author: c.req.query("author"),
      copies: Number(c.req.query("copies")) || undefined,
    })
    return c.json(books)
  } catch (e) {
    console.warn("Error in fetching books from SB database", e);
    return c.json([])
  }
})

// individuell GET hämta en Book om den finns baserat på ID annars null 404
books.get("/:id", async (c) => {
  const bookId = c.req.param("id");
  try {
    const book = await getBookById(bookId);
    return c.json(book);
  } catch (e) {
    console.warn("Error in fetching book from SB database", e);
    return c.json(null, 404);
  }
});

// "Skapande" av en Book POST genom en JSON body använd Postman eller thunderclient för detta
books.post("/", bookValidator, async (c) => {
  const bookBody: NewBook = c.req.valid("json");
  try {
    const book = await createBook(bookBody);
    return c.json(book, 201);
  } catch (e) {
    console.warn("error in inserting book into SB DB", e);
    return c.json(e, 500);
  }
});

// Extra: "Updaterande" av en Book PUT/PATCH (för patch kolla Partial types)
// om den finns tänk en blandning mellan GET + POST
books.patch("/:id", bookOptionalValidator, async (c) => {
  const bookId = c.req.param("id");
  const bookBody: Partial<Book> = c.req.valid("json");
  try {
    const book = await updateBookById(bookId, bookBody);
    return c.json(book);
  } catch (e) {
    console.log("Error updating book in SB DB", e);
    return c.json(null, 404);
  }
});

// Extra: "bortagning" av en Book DELETE om den finns tänk en GET som sedan tar bort 200/204
books.delete("/:id", async (c) => {
  const bookId = c.req.param("id");
  try {
    await deleteBookById(bookId);
    return c.json(null, 200);
  } catch (e) {
    console.warn("Error in deleting book", e);
    return c.json(null, 404);
  }
});
export default books;
