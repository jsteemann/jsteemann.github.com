#include <iostream>
#include <chrono>
#include <functional>
#include <string>
#include <cstdint>
#include <cstdlib>
#include <climits>
#include <memory>
#include <vector>
#include <array>
  
// abstract base class for tests
class Test { 
 public:
  // name of implementation
  virtual std::string name() const = 0;
  // implementation function
  virtual uint64_t func(std::string const&) = 0;

  // test execution function
  uint64_t run(std::string const& value, size_t n) {       
    uint64_t total = 0;                                    
    for (size_t i = 0; i < n; ++i) {                       
      total += func(value);                                
    }                                                      
    return total;                                          
  }                                                     

};


class TestStoull final : public Test {
 public:
  std::string name() const { return "std::stoull"; }
 
 private:    
  inline uint64_t func(std::string const& value) {
    return std::stoull(value);
  }
};

class TestStrtoull final : public Test {
 public:
  std::string name() const { return "std::strtoull"; }
  
 private:    
  inline uint64_t func(std::string const& value) {
    char* endPtr = nullptr;
    // ignore all errors here
    unsigned long long r = std::strtoull(value.c_str(), &endPtr, 10);
    return static_cast<uint64_t>(r); 
  }
};

class TestNaive final : public Test {
 public:
  std::string name() const { return "naive"; }
  
 private:
  inline uint64_t func(std::string const& value) {
    uint64_t result = 0;
    char const* p = value.c_str();
    char const* q = p + value.size();
    while (p < q) {
      result *= 10;
      result += *(p++) - '0';
    }
    return result;
  }
};
    
class TestBitshift final : public Test {
 public:
  std::string name() const { return "bitshift"; }
  
 private:
  inline uint64_t func(std::string const& value) {
    uint64_t result = 0;

    char const* p = value.c_str();
    char const* q = p + value.size();
    while (p < q) {
      result = (result << 1) + (result << 3) + *(p++) - '0';
    }
    return result;
  }
};

class TestUnrolled final : public Test {
 public:
  std::string name() const { return "unrolled"; }
  
 private:
  inline uint64_t func(std::string const& value) {
    uint64_t result = 0;
    
    size_t const length = value.size();
    switch (length) { 
      case 20:    result += (value[length - 20] - '0') * 10000000000000000000ULL;
      case 19:    result += (value[length - 19] - '0') * 1000000000000000000ULL;
      case 18:    result += (value[length - 18] - '0') * 100000000000000000ULL;
      case 17:    result += (value[length - 17] - '0') * 10000000000000000ULL;
      case 16:    result += (value[length - 16] - '0') * 1000000000000000ULL;
      case 15:    result += (value[length - 15] - '0') * 100000000000000ULL;
      case 14:    result += (value[length - 14] - '0') * 10000000000000ULL;
      case 13:    result += (value[length - 13] - '0') * 1000000000000ULL;
      case 12:    result += (value[length - 12] - '0') * 100000000000ULL;
      case 11:    result += (value[length - 11] - '0') * 10000000000ULL;
      case 10:    result += (value[length - 10] - '0') * 1000000000ULL;
      case  9:    result += (value[length -  9] - '0') * 100000000ULL;
      case  8:    result += (value[length -  8] - '0') * 10000000ULL;
      case  7:    result += (value[length -  7] - '0') * 1000000ULL;
      case  6:    result += (value[length -  6] - '0') * 100000ULL;
      case  5:    result += (value[length -  5] - '0') * 10000ULL;
      case  4:    result += (value[length -  4] - '0') * 1000ULL;
      case  3:    result += (value[length -  3] - '0') * 100ULL;
      case  2:    result += (value[length -  2] - '0') * 10ULL;
      case  1:    result += (value[length -  1] - '0');
    }
    return result;
  }
};

class TestLookup final : public Test {
 public:
  std::string name() const { return "lookup"; }
  
 private:
  inline uint64_t func(std::string const& value) {
    static uint64_t const digits[100] = {
      0ULL, 0ULL, 0ULL, 0ULL, 0ULL, 0ULL, 0ULL, 0ULL, 0ULL, 0ULL, 
      1ULL, 10ULL, 100ULL, 1000ULL, 10000ULL, 100000ULL, 1000000ULL, 10000000ULL, 100000000ULL, 1000000000ULL, 
      2ULL, 20ULL, 200ULL, 2000ULL, 20000ULL, 200000ULL, 2000000ULL, 20000000ULL, 200000000ULL, 2000000000ULL, 
      3ULL, 30ULL, 300ULL, 3000ULL, 30000ULL, 300000ULL, 3000000ULL, 30000000ULL, 300000000ULL, 3000000000ULL, 
      4ULL, 40ULL, 400ULL, 4000ULL, 40000ULL, 400000ULL, 4000000ULL, 40000000ULL, 400000000ULL, 4000000000ULL, 
      5ULL, 50ULL, 500ULL, 5000ULL, 50000ULL, 500000ULL, 5000000ULL, 50000000ULL, 500000000ULL, 5000000000ULL, 
      6ULL, 60ULL, 600ULL, 6000ULL, 60000ULL, 600000ULL, 6000000ULL, 60000000ULL, 600000000ULL, 6000000000ULL, 
      7ULL, 70ULL, 700ULL, 7000ULL, 70000ULL, 700000ULL, 7000000ULL, 70000000ULL, 700000000ULL, 7000000000ULL, 
      8ULL, 80ULL, 800ULL, 8000ULL, 80000ULL, 800000ULL, 8000000ULL, 80000000ULL, 800000000ULL, 8000000000ULL, 
      9ULL, 90ULL, 900ULL, 9000ULL, 90000ULL, 900000ULL, 9000000ULL, 90000000ULL, 900000000ULL, 9000000000ULL
    };

    uint64_t result = 0;

    size_t pos = value.size() - 1;
    char const* p = value.c_str();
    char const* q = p + value.size();
    while (pos >= 10) {
      result += digits[(*p - '0') * 10 + pos - 10] * 10000000000ULL;
      ++p;
      --pos;
    }
    while (p < q) {
      result += digits[(*p - '0') * 10 + pos];
      ++p;
      --pos;
    }
    return result;
  }
};

static void run(std::string const& value, size_t n, Test* test) {
  // fetch start time
  auto begin = std::chrono::system_clock::now();
  // execute test function
  uint64_t result = test->run(value, n);
  // fetch elapsed wall clock time
  auto end = std::chrono::system_clock::now();
               
  auto ms = std::chrono::duration_cast<std::chrono::milliseconds>(end - begin).count();

  // print results
  // note that we need to print the result - otherwise compilers
  // may optimize the call to the test function away completely!
  std::cout << "test '" << test->name() << "'" <<
               std::string(18 - test->name().size(), ' ') << 
               "string '" << value << "'" << 
               std::string(28 - value.size(), ' ') << 
               ms << " ms" <<
               std::string(12 - std::to_string(ms).size(), ' ') << 
               "result: " << std::to_string(result) << 
               std::endl;
}

int main() {
  // number of runs for each test
  std::array<size_t, 5> const counts = { 10000, 100000, 1000000, 10000000, 100000000 };

  // the different test classes
  std::vector<std::unique_ptr<Test>> tests;
  tests.emplace_back(new TestStoull);
  tests.emplace_back(new TestStrtoull);
  tests.emplace_back(new TestNaive);
  tests.emplace_back(new TestBitshift);
  tests.emplace_back(new TestUnrolled);
  tests.emplace_back(new TestLookup);

  for (auto count : counts) {
    std::cout << "n = " << count << std::endl;
    std::cout << std::string(110, '-') << std::endl;

    for (auto const& test : tests) {
      // strings that will be converted to uint64_t
      run("1",                    count, test.get());
      run("99",                   count, test.get());
      run("1234",                 count, test.get());
      run("1234567",              count, test.get());
      run("1234567891",           count, test.get());
      run("12345678901234",       count, test.get());
      run("12345678901234678901", count, test.get());
    
      std::cout << std::endl;
    }

    std::cout << std::endl;
  }
}
