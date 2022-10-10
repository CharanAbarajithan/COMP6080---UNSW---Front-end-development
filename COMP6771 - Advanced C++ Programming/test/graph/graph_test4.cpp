#include "gdwg/graph.hpp"

#include <catch2/catch.hpp>

TEST_CASE("accessors test") {
	auto g = gdwg::graph<std::string, int>{};
	auto const v = std::vector<gdwg::graph<std::string, int>::value_type>{
	   {"A", "B", 5},
	   {"A", "C", 8},
	   {"B", "C", 2},
	   {"C", "D", 1},
	   {"B", "A", 4},
	   {"C", "D", 3},
	};

	for (const auto& x : v) {
		g.insert_node(x.from);
		g.insert_node(x.to);
		g.insert_edge(x.from, x.to, x.weight);
	};

	CHECK(g.is_node("B"));
	CHECK_FALSE(g.empty());
	CHECK(g.is_connected("A", "B"));
	CHECK_FALSE(g.is_connected("A", "D"));

	auto nodes = std::vector<std::string>{"A", "B", "C", "D"};
	CHECK(g.nodes() == nodes);

	auto weights = std::vector<int>{1, 3};
	CHECK(g.weights("C", "D") == weights);

	auto connected_nodes = std::vector<std::string>{"B", "C"};
	CHECK(g.connections("A") == connected_nodes);
}