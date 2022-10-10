#include "gdwg/graph.hpp"

#include <catch2/catch.hpp>
#include <sstream>

TEST_CASE("insertion test") {
	auto g = gdwg::graph<std::string, int>{};
	auto b1 = g.insert_node("A");
	CHECK(b1);

	g.insert_node("B");
	g.insert_node("C");
	g.insert_node("D");

	auto b2 = g.insert_node("A");
	CHECK_FALSE(b2);

	auto b3 = g.insert_edge("A", "B", 5);
	CHECK(b3);

	auto b4 = g.insert_edge("A", "B", 8);
	CHECK(b4);

	g.insert_edge("B", "C", 2);
	g.insert_edge("B", "D", 1);
	g.insert_edge("B", "A", 4);
	g.insert_edge("C", "D", 3);

	auto b5 = g.insert_edge("A", "B", 8);
	CHECK_FALSE(b5);

	CHECK_THROWS(g.insert_edge("E", "D", 1));
}

TEST_CASE("replace test") {
	auto g = gdwg::graph<std::string, int>{};
	auto const v = std::vector<gdwg::graph<std::string, int>::value_type>{
	   {"A", "B", 5},
	   {"A", "C", 8},
	   {"B", "C", 2},
	   {"B", "D", 1},
	   {"B", "A", 4},
	   {"C", "D", 3},
	};

	for (const auto& x : v) {
		g.insert_node(x.from);
		g.insert_node(x.to);
		g.insert_edge(x.from, x.to, x.weight);
	};

	auto b1 = g.replace_node("B", "A");
	CHECK_FALSE(b1);

	CHECK_THROWS(g.replace_node("E", "F"));

	auto b2 = g.replace_node("B", "F");
	CHECK(b2);

	auto out = std::ostringstream{};
	out << g;
	auto const expected_output = std::string_view(R"(A (
  C | 8
  F | 5
)
C (
  D | 3
)
D (
)
F (
  A | 4
  C | 2
  D | 1
)
)");
	CHECK(out.str() == expected_output);
}

TEST_CASE("merge replace test") {
	auto g = gdwg::graph<std::string, int>{};
	auto const v = std::vector<gdwg::graph<std::string, int>::value_type>{
	   {"A", "B", 1},
	   {"A", "C", 2},
	   {"A", "D", 3},
	   {"B", "B", 1},
	};

	for (const auto& x : v) {
		g.insert_node(x.from);
		g.insert_node(x.to);
		g.insert_edge(x.from, x.to, x.weight);
	};

	g.merge_replace_node("A", "B");

	auto out = std::ostringstream{};
	out << g;
	auto const expected_output = std::string_view(R"(B (
  B | 1
  C | 2
  D | 3
)
C (
)
D (
)
)");
	CHECK(out.str() == expected_output);
}

TEST_CASE("erase node test") {
	auto g = gdwg::graph<std::string, int>{};
	auto const v = std::vector<gdwg::graph<std::string, int>::value_type>{
	   {"A", "B", 1},
	   {"A", "C", 2},
	   {"A", "D", 3},
	   {"B", "B", 1},
	};

	for (const auto& x : v) {
		g.insert_node(x.from);
		g.insert_node(x.to);
		g.insert_edge(x.from, x.to, x.weight);
	};

	auto b = g.erase_node("B");
	CHECK(b);

	auto out = std::ostringstream{};
	out << g;
	auto const expected_output = std::string_view(R"(A (
  C | 2
  D | 3
)
C (
)
D (
)
)");
	CHECK(out.str() == expected_output);
}

TEST_CASE("erase edge test") {
	auto g = gdwg::graph<std::string, int>{};
	auto const v = std::vector<gdwg::graph<std::string, int>::value_type>{
	   {"A", "B", 1},
	   {"A", "C", 2},
	   {"A", "D", 3},
	   {"B", "B", 1},
	};

	for (const auto& x : v) {
		g.insert_node(x.from);
		g.insert_node(x.to);
		g.insert_edge(x.from, x.to, x.weight);
	};

	auto b = g.erase_edge("A", "B", 1);
	CHECK(b);

	auto out = std::ostringstream{};
	out << g;
	auto const expected_output = std::string_view(R"(A (
  C | 2
  D | 3
)
B (
  B | 1
)
C (
)
D (
)
)");
	CHECK(out.str() == expected_output);
}