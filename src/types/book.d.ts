type BookGenre = "fiction" | "nonfiction";

interface Book {
  book_id: number;
  title: string;
  author: string;
  description: string;
  published_year: number;
  copies: number;
  genre: BookGenre;
  created_at: string;
}

type NewBook = Omit<Book, "book_id" | "created_at">

type BookValidKey = keyof Book
