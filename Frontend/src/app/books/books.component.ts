import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {BooksApiService} from '@api-services/books-api.service';
import {Book} from '@contracts';

@Component({
  selector: 'app-books',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './books.component.html',
  styleUrls: ['./books.component.scss']
})
export class BooksComponent implements OnInit {
  books: Book[] = [];
  filteredBooks: Book[] = [];
  searchAuthor: string = '';
  searchTitle: string = '';
  isLoading: boolean = false;
  error: string = '';

  newBook: Book = {
    title: '',
    author: ''
  };

  isAddingBook: boolean = false;

  constructor(private booksApiService: BooksApiService) {
  }

  ngOnInit(): void {
    this.loadBooks();
  }

  loadBooks(): void {
    this.isLoading = true;
    this.error = '';
    this.booksApiService.getAllBooks().subscribe({
      next: (books) => {
        this.books = books;
        this.filteredBooks = books;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load books: ' + err.message;
        this.isLoading = false;
      }
    });
  }

  addBook(): void {
    if (!this.newBook.title || !this.newBook.author) {
      this.error = 'Title and Author are required';
      return;
    }

    this.isLoading = true;
    this.error = '';
    this.booksApiService.addBook(this.newBook).subscribe({
      next: (book) => {
        this.books.push(book);
        this.filteredBooks = this.books;
        this.newBook = { title: '', author: '' };
        this.isAddingBook = false;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to add book: ' + err.message;
        this.isLoading = false;
      }
    });
  }

  searchByAuthor(): void {
    if (!this.searchAuthor) {
      this.filteredBooks = this.books;
      return;
    }

    this.isLoading = true;
    this.error = '';
    this.booksApiService.getBooksByAuthor(this.searchAuthor).subscribe({
      next: (books) => {
        this.filteredBooks = books;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to search books: ' + err.message;
        this.isLoading = false;
      }
    });
  }

  searchByTitle(): void {
    if (!this.searchTitle) {
      this.filteredBooks = this.books;
      return;
    }

    this.isLoading = true;
    this.error = '';
    this.booksApiService.getBookByTitle(this.searchTitle).subscribe({
      next: (book) => {
        this.filteredBooks = book ? [book] : [];
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to search book: ' + err.message;
        this.isLoading = false;
      }
    });
  }

  clearSearch(): void {
    this.searchAuthor = '';
    this.searchTitle = '';
    this.filteredBooks = this.books;
  }

  toggleAddBook(): void {
    this.isAddingBook = !this.isAddingBook;
    if (!this.isAddingBook) {
      this.newBook = { title: '', author: '' };
      this.error = '';
    }
  }

  cancelAdd(): void {
    this.isAddingBook = false;
    this.newBook = { title: '', author: '' };
    this.error = '';
  }
}

