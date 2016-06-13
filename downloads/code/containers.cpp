#include <iostream>
#include <deque>
#include <vector>
#include <string>
#include <map>
#include <set>
#include <unordered_map>
#include <unordered_set>
#include <new>
#include <cstdint>

// number of objects to create
static size_t n = 0;

// total bytes allocated
static size_t bytes = 0;

// total number of malloc calls
static size_t allocations = 0;

// total number free calls
static size_t frees = 0;

// whether or not to track & print allocations
static bool output = false;

// static vector for tracking allocation sizes
static std::vector<std::pair<void*, size_t>> sizes;
  
static void* alloc(size_t size) {
  void* p = std::malloc(size);
  if (output && p != nullptr) {
    // update stats
    bytes += size;
    ++allocations;
    sizes.emplace_back(p, size);
    // for debugging
    // std::cout << "- allocating " << size << " bytes at memory location " << p << std::endl;
  }
  return p;
}

static void dealloc(void* p) {
  if (p == nullptr) {
    return;
  }
  if (output) {
    // update the stats
    ++frees;
    size_t size = 0;
    for (auto it = sizes.begin(); it != sizes.end(); ++it) {
      if ((*it).first == p) {
        size = (*it).second;
        sizes.erase(it);
        break;
      }
    }
    // for debugging
    // std::cout << "- freeing " << size << " bytes at memory location " << p << std::endl;
  }
  std::free(p);
}

static void enableOutput() { 
  output = true; 
  allocations = 0;
  frees = 0;
  bytes = 0;
  sizes.clear();
}

static void disableOutput() { 
  output = false; 
  size_t size = 0;
  for (auto it = sizes.begin(); it != sizes.end(); ++it) {
    size += (*it).second;
  }
  std::cout << "=> " << size << " bytes allocd at end - total: " << bytes << " bytes mallocd, " << allocations << " malloc(s), " << frees << " free(s)" << std::endl;
}


void* operator new(size_t size) throw(std::bad_alloc) {
  return alloc(size);
}

void* operator new(size_t size, std::nothrow_t const&) throw() {
  return alloc(size);
}

void* operator new[](size_t size) throw(std::bad_alloc) {
  return alloc(size);
}

void* operator new[](size_t size, std::nothrow_t const&) throw() {
  return alloc(size);
}

void operator delete(void* p) throw() {
  dealloc(p);
}

void operator delete(void* p, std::nothrow_t const&) throw() {
  dealloc(p);
}

void operator delete[](void* p) throw() {
  dealloc(p);
}

void operator delete[](void* p, std::nothrow_t const&) throw() {
  dealloc(p);
}


static void makeVector() {
  std::cout << "vector         ";

  enableOutput();
  std::vector<uint64_t> foo;
  for (size_t i = 0; i < n; ++i) {
    foo.emplace_back(i);
  }
  disableOutput();
}

static void makeMap() {
  std::cout << "map            ";
  enableOutput();
  std::map<uint64_t, uint64_t> foo;
  
  for (size_t i = 0; i < n; ++i) {
    foo.emplace(i, i);
  }
  disableOutput();
}

static void makeSet() {
  std::cout << "set            ";
  enableOutput();
  std::set<uint64_t> foo;

  for (size_t i = 0; i < n; ++i) {
    foo.emplace(i);
  }
  disableOutput();
}

static void makeUnorderedMap() {
  std::cout << "unordered_map  ";
  enableOutput();
  std::unordered_map<uint64_t, uint64_t> foo;
  
  for (size_t i = 0; i < n; ++i) {
    foo.emplace(i, i);
  }
  disableOutput();
}

static void makeUnorderedSet() {
  std::cout << "unordered_set  ";
  enableOutput();
  std::unordered_set<uint64_t> foo;
  
  for (size_t i = 0; i < n; ++i) {
    foo.emplace(i);
  }
  disableOutput();
}

static void makeDeque() {
  std::cout << "deque          ";
  enableOutput();
  std::deque<uint64_t> foo;
  
  for (size_t i = 0; i < n; ++i) {
    foo.emplace_back(i);
  }
  disableOutput();
}

int main(int argc, char* argv[]) {
  if (argc == 1) {
    n = 0;
  } else {
    n = std::atoi(argv[1]);
  }

  if (n > 2048) {
    std::cerr << "please use an n <= 2048" << std::endl;
    std::exit(1);
  }

  // must be big enough to cope with ALL allocations made by the program
  sizes.reserve(4096);

  std::cout << "n = " << std::string(5 - std::to_string(n).size(), ' ') << n << std::endl;
  std::cout << "---------" << std::endl;

  makeVector();
  makeMap();
  makeSet();
  makeUnorderedMap();
  makeUnorderedSet();
  makeDeque();

  std::cout << std::endl << std::endl;
}
