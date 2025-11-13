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
        public IEnumerable<Book> GetBooks()
        {
            return Books;
        }

        [HttpPost]
        public Book AddBook([FromBody] Book book)
        {
            Books.Add(book);
            return book;
        }
    }

    public class Book
    {
        public required string Title { get; set; }
        public required string Author { get; set; }
    }
}
