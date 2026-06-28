import axios from "axios";

const API_URL = "http://localhost:3000/api";
let adminToken = "";
let memberToken = "";
let memberId = "";
let bookId = "";
let borrowId = "";

const state = { errors: 0, passed: 0 };

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    state.passed++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    state.errors++;
  }
}

async function runTests() {
  console.log("--- Starting API Tests & DB Integrity Checks ---");
  const ts = Date.now();
  const safeName = "Test Member";
  const safeEmail = `member${ts}@example.com`;

  try {
    // 1. Auth & Roles
    const regRes = await axios.post(`${API_URL}/auth/register`, {
      name: safeName, email: safeEmail, password: "Password123!"
    });
    assert(regRes.status === 201, "Register Member");
    memberId = regRes.data.data.user.id;

    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: safeEmail, password: "Password123!"
    });
    assert(loginRes.status === 200, "Login Member");
    memberToken = loginRes.data.data.accessToken;

    try {
      await axios.post(`${API_URL}/auth/register`, {
        name: `Dup Name`, email: safeEmail, password: "Password123!"
      });
      assert(false, "Duplicate Email Allowed");
    } catch (e: any) { assert(e.response?.status === 409, "Duplicate Email Blocked"); }

    const adminLogin = await axios.post(`${API_URL}/auth/login`, {
      email: "librarian@library.com", password: "Password123!"
    });
    adminToken = adminLogin.data.data.accessToken;
    assert(!!adminToken, "Login Librarian");

    // 2. Books
    const fakeIsbn = `123${String(ts).slice(-7)}`;
    const addRes = await axios.post(`${API_URL}/books`, {
      title: `New Book ${ts}`, author: "Author Name", isbn: fakeIsbn, category: "Test", quantity: 2
    }, { headers: { Authorization: `Bearer ${adminToken}` } });
    assert(addRes.status === 201, "Add Book");
    bookId = addRes.data.data.book.id;

    try {
      await axios.post(`${API_URL}/books`, {
        title: `Dup ISBN`, author: "Author Name", isbn: fakeIsbn, category: "Test", quantity: 1
      }, { headers: { Authorization: `Bearer ${adminToken}` } });
      assert(false, "Duplicate ISBN Allowed");
    } catch (e: any) { assert(e.response?.status === 409, "Duplicate ISBN Blocked"); }

    const getBooksRes = await axios.get(`${API_URL}/books`);
    assert(getBooksRes.data.data.books.length > 0, "Get Books");

    // 3. Borrows
    const borrowRes = await axios.post(`${API_URL}/borrows/borrow`, {
      memberId, bookId
    }, { headers: { Authorization: `Bearer ${adminToken}` } });
    assert(borrowRes.status === 201, "Borrow Book");

    try {
      await axios.post(`${API_URL}/borrows/borrow`, {
        memberId, bookId
      }, { headers: { Authorization: `Bearer ${adminToken}` } });
      assert(false, "Borrow Same Book Twice Allowed");
    } catch (e: any) { assert(e.response?.status === 409, "Borrow Same Book Twice Blocked"); }

    // 4. Returns
    const returnRes = await axios.post(`${API_URL}/borrows/return`, {
      memberId, bookId
    }, { headers: { Authorization: `Bearer ${adminToken}` } });
    assert(returnRes.status === 200, "Return Book");

    try {
      await axios.post(`${API_URL}/borrows/return`, {
        memberId, bookId
      }, { headers: { Authorization: `Bearer ${adminToken}` } });
      assert(false, "Return without active borrow allowed");
    } catch (e: any) { assert(e.response?.status === 404, "Return without active borrow Blocked"); }

    // Members
    const membersRes = await axios.get(`${API_URL}/members`, { headers: { Authorization: `Bearer ${adminToken}` } });
    assert(membersRes.status === 200, "Get Members");

  } catch (e: any) {
    console.error("Test failed ungracefully:", e.response?.data || e.message);
  }

  console.log(`\nTests completed. Passed: ${state.passed}, Failed: ${state.errors}`);
}

runTests();
