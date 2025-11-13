namespace Backend.Controllers
{
    using Microsoft.AspNetCore.Mvc;
    using System.Collections.Generic;

    [ApiController]
    [Route("api/[controller]")]
    public class BooksController : ControllerBase
    {
        private static readonly List<Book> Books = new()
        {
            new Book { Title = "The Hobbit", Author = "J.R.R. Tolkien" },
            new Book { Title = "1984", Author = "George Orwell" },
            new Book { Title = "To Kill a Mockingbird", Author = "Harper Lee" }
        };

        [HttpGet]
        public IEnumerable<Book> GetAllBooks()
        {
            return Books;
        }

        [HttpPost]
        public Book AddBook([FromBody] Book book)
        {
            Books.Add(book);
            return book;
        }

        [HttpGet("title/{title}")]
        public Book? GetBookByTitle(string title)
        {
            return Books.FirstOrDefault(b => b.Title.Equals(title, StringComparison.OrdinalIgnoreCase));
        }

        [HttpGet("author/{author}")]
        public IEnumerable<Book> GetBooksByAuthor(string author)
        {
            return Books.Where(b => b.Author.Equals(author, StringComparison.OrdinalIgnoreCase));
        }
    }

    public class Book
    {
        public required string Title { get; set; }
        public required string Author { get; set; }
    }
}
