#include "gdwg/graph.hpp"

#include <catch2/catch.hpp>

TEST_CASE("creation test") {
	auto g = gdwg::graph<std::string, int>{};
	g.insert_node("A");
	g.insert_node("B");
	g.insert_node("C");
	g.insert_node("D");

	g.insert_edge("A", "B", 5);
	g.insert_edge("A", "C", 8);
	g.insert_edge("B", "C", 2);
	g.insert_edge("B", "D", 1);
	g.insert_edge("B", "A", 4);
	g.insert_edge("C", "D", 3);

	auto g2 = gdwg::graph<std::string, int>(g);

	CHECK_FALSE(g2.empty());
	CHECK(g2 == g);
}
