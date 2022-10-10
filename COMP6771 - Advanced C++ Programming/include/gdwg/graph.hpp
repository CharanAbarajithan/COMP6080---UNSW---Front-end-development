#ifndef GDWG_GRAPH_HPP
#define GDWG_GRAPH_HPP

#include <map>
#include <ostream>
#include <set>
#include <vector>

namespace gdwg {
	template<typename N, typename E>
	class graph {
	public:
		class iterator;
		struct value_type {
			N from;
			N to;
			E weight;
		};

		// Your member functions go here
		// Constructors
		graph() {
			this->_nodes = std::set<std::unique_ptr<N>>();
			this->_edges = std::map<std::pair<N*, N*>, std::set<std::unique_ptr<E>>>();
		}

		graph(std::initializer_list<N> il) {
			graph();
			for (auto i = il.begin(); i != il.end(); ++i) {
				this->insert_node(*i);
			}
		}

		template<typename InputIt>
		graph(InputIt first, InputIt last) {
			graph();
			for (auto i = first; i != last; ++i) {
				this->insert_node(*i);
			}
		}

		graph(graph&& other) noexcept {
			this->_nodes = std::move(other._nodes);
			this->_edges = std::move(other._edges);
		}

		auto operator=(graph&& other) noexcept -> graph& {
			std::swap(this->_nodes, other._nodes);
			std::swap(this->_edges, other._edges);
			other.clear();
			return *this;
		}

		graph(graph const& other) {
			graph();
			for (auto n : other.nodes()) {
				this->insert_node(n);
			}
			for (auto [key, value] : other.edges()) {
				for (auto v : value) {
					this->insert_edge(key.first, key.second, v);
				}
			}
		}

		auto operator=(graph const& other) -> graph& {
			if (this == other) {
				return *this;
			}

			auto tmp = other;
			std::swap(this->_nodes, tmp._nodes);
			std::swap(this->_edges, tmp._edges);
			return *this;
		}

		// Modifiers
		auto insert_node(N const& value) -> bool {
			if (is_node(value)) {
				return false;
			}
			N tmp = value;
			std::unique_ptr<N> node = std::make_unique<N>(tmp);
			this->_nodes.insert(std::move(node));
			return true;
		}

		auto insert_edge(N const& src, N const& dst, E const& weight) -> bool {
			if (!is_node(src) || !is_node(dst)) {
				throw std::runtime_error("Cannot call gdwg::graph<N, E>::insert_edge when either src "
				                         "or dst node does not exist");
			}

			N* src_pointer = get_node_pointer(src);
			N* dst_pointer = get_node_pointer(dst);

			// Edge exists
			for (auto& e : _edges[std::make_pair(src_pointer, dst_pointer)]) {
				if (weight == *e.get()) {
					return false;
				}
			}

			// Edge does not exist
			std::unique_ptr<E> edge = std::make_unique<E>(weight);
			_edges[std::make_pair(src_pointer, dst_pointer)].insert(std::move(edge));
			return true;
		}

		auto replace_node(N const& old_data, N const& new_data) -> bool {
			if (is_node(new_data)) {
				return false;
			}

			if (!is_node(old_data)) {
				throw std::runtime_error("Cannot call gdwg::graph<N, E>::replace_node on a node that "
				                         "doesn't exist");
			}

			N* node_pointer = get_node_pointer(old_data);
			*node_pointer = new_data;
			return true;
		}

		auto merge_replace_node(N const& old_data, N const& new_data) -> void {
			if (!is_node(old_data) || !is_node(new_data)) {
				throw std::runtime_error("Cannot call gdwg::graph<N, E>::merge_replace_node on old or "
				                         "new data if they don't exist in the graph");
			}

			auto old_data_pointer = get_node_pointer(old_data);
			auto new_data_pointer = get_node_pointer(new_data);

			auto edges_to_replace = std::vector<std::pair<N*, N*>>();
			for (auto i = _edges.begin(); i != _edges.end(); ++i) {
				auto key = i->first;
				if (*key.first == new_data || *key.second == new_data) {
					edges_to_replace.push_back(key);
				}
			}

			for (auto e : edges_to_replace) {
				auto updated_edge = _edges.extract(e);
				if (updated_edge.key().first == new_data_pointer) {
					updated_edge.key().first = old_data_pointer;
				}
				else {
					updated_edge.key().second = old_data_pointer;
				}
				_edges.insert(std::move(updated_edge));
			}

			erase_node(new_data);
			*old_data_pointer = new_data;
		}

		auto erase_node(N const& value) -> bool {
			if (!is_node(value)) {
				return false;
			}

			auto i = _edges.begin();
			while (i != _edges.end()) {
				auto key = i->first;
				if (*key.first == value || *key.second == value) {
					i = _edges.erase(i);
				}
				else {
					++i;
				}
			}

			auto i2 = _nodes.begin();
			while (i2 != _nodes.end()) {
				if (**i2 == value) {
					i2 = _nodes.erase(i2);
				}
				else {
					++i2;
				}
			}

			return true;
		}

		auto erase_edge(N const& src, N const& dst, E const& weight) -> bool {
			if (!is_node(src) || !is_node(dst)) {
				throw std::runtime_error("Cannot call gdwg::graph<N, E>::erase_edge on src or dst if "
				                         "they don't exist in the graph");
			}

			if (!is_connected(src, dst)) {
				return false;
			}

			N* src_pointer = get_node_pointer(src);
			N* dst_pointer = get_node_pointer(dst);

			auto i = _edges.at(std::make_pair(src_pointer, dst_pointer)).begin();
			while (i != _edges.at(std::make_pair(src_pointer, dst_pointer)).end()) {
				if (**i == weight) {
					_edges.at(std::make_pair(src_pointer, dst_pointer)).erase(i);
					_edges.at(std::make_pair(src_pointer, dst_pointer)).end();
					if (_edges.at(std::make_pair(src_pointer, dst_pointer)).empty()) {
						_edges.erase(std::make_pair(src_pointer, dst_pointer));
					}
					return true;
				}
				++i;
			}
			return false;
		}

		auto erase_edge(iterator i) -> iterator {
			if (i == this->end()) {
				return this->end();
			}

			auto next = i;
			++next;

			erase_edge((*i).from, (*i).to, (*i).weight);

			if (next == this->end()) {
				return this->end();
			}

			return find((*next).from, (*next).to, (*next).weight);
		}

		auto erase_edge(iterator i, iterator s) -> iterator {
			auto res = i;
			while (res != s) {
				res = erase_edge(res);
			}
			return res;
		}

		auto clear() noexcept -> void {
			_nodes.clear();
			_edges.clear();
		}

		// Accessors
		[[nodiscard]] auto is_node(N const& value) const -> bool {
			return get_node_pointer(value) != nullptr;
		}

		[[nodiscard]] auto empty() -> bool {
			return _nodes.empty() && _edges.empty();
		}

		[[nodiscard]] auto is_connected(N const& src, N const& dst) -> bool {
			if (!is_node(src) || !is_node(dst)) {
				throw std::runtime_error("Cannot call gdwg::graph<N, E>::is_connected if src or dst "
				                         "node don't exist in the graph");
			}

			return !_edges[std::make_pair(get_node_pointer(src), get_node_pointer(dst))].empty();
		}

		[[nodiscard]] auto nodes() const -> std::vector<N> {
			auto res = std::vector<N>();
			for (auto& n : _nodes) {
				res.push_back(*n.get());
			}
			std::sort(res.begin(), res.end());
			return res;
		}

		[[nodiscard]] auto weights(N const& src, N const& dst) -> std::vector<E> {
			if (!is_node(src) || !is_node(dst)) {
				throw std::runtime_error("Cannot call gdwg::graph<N, E>::weights if src or dst node "
				                         "don't exist in the graph");
			}

			auto res = std::vector<E>();
			auto src_pointer = get_node_pointer(src);
			auto dst_pointer = get_node_pointer(dst);
			for (auto& i : _edges[std::make_pair(src_pointer, dst_pointer)]) {
				res.push_back(*i.get());
			}
			std::sort(res.begin(), res.end());
			return res;
		}

		[[nodiscard]] auto find(N const& src, N const& dst, E const& weight) -> iterator {
			for (auto i = begin(); i != end(); ++i) {
				if ((*i).from == src && (*i).to == dst && (*i).weight == weight) {
					return i;
				}
			}
			return end();
		}

		[[nodiscard]] auto connections(N const& src) const -> std::vector<N> {
			if (!is_node(src)) {
				throw std::runtime_error("Cannot call gdwg::graph<N, E>::connections if src doesn't "
				                         "exist in the graph");
			}

			auto res = std::set<N>();
			for (auto& [key, value] : _edges) {
				if (*key.first == src && !value.empty()) {
					res.insert(*key.second);
				}
			}

			auto res2 = std::vector<N>(res.begin(), res.end());
			std::sort(res2.begin(), res2.end());
			return res2;
		}

		// Iterator access
		[[nodiscard]] auto begin() const -> iterator {
			if (_edges.empty()) {
				return iterator(_edges, _edges.begin(), {});
			}
			return iterator(_edges, _edges.begin(), _edges.begin()->second.begin());
		}

		[[nodiscard]] auto end() const -> iterator {
			return iterator(_edges, _edges.end(), {});
		}

		// Comparisons
		[[nodiscard]] auto operator==(graph const& other) const -> bool {
			return (this->nodes() == other.nodes()) && this->edges() == other.edges();
		}

		[[nodiscard]] auto edges() const -> std::map<std::pair<N, N>, std::set<E>> {
			auto map_res = std::map<std::pair<N, N>, std::set<E>>();
			for (auto& [key, values] : _edges) {
				auto ws = std::set<E>();
				for (auto& v : values) {
					ws.insert(*v);
				}
				map_res[std::make_pair(*key.first, *key.second)] = ws;
			}
			return map_res;
		}

		// Extractor
		friend auto operator<<(std::ostream& os, graph const& g) -> std::ostream& {
			std::vector<N> nodes = g.nodes();
			std::map<std::pair<N, N>, std::set<E>> edges = g.edges();

			for (auto n : nodes) {
				os << n << " (" << std::endl;
				std::vector<N> connections = g.connections(n);
				for (auto con : connections) {
					for (auto e : edges[std::make_pair(n, con)]) {
						os << "  " << con << " | " << e << std::endl;
					}
				}
				os << ")" << std::endl;
			}
			return os;
		}

		// Iterator
		class iterator {
		public:
			using value_type = graph<N, E>::value_type;
			using reference = value_type;
			using pointer = void;
			using difference_type = std::ptrdiff_t;
			using iterator_category = std::bidirectional_iterator_tag;
			using edge_iterator =
			   typename std::map<std::pair<N*, N*>, std::set<std::unique_ptr<E>>>::const_iterator;
			using node_iterator = typename std::set<std::unique_ptr<E>>::const_iterator;

			// Iterator constructor
			iterator() = default;

			// Iterator source
			auto operator*() -> reference {
				return graph<N, E>::value_type{*_edge_iterator->first.first,
				                               *_edge_iterator->first.second,
				                               **_node_iterator};
			}

			// Iterator traversal
			auto operator++() -> iterator& {
				if (_node_iterator != _edge_iterator->second.end()) {
					++_node_iterator;
					if (_node_iterator != _edge_iterator->second.end()) {
						return *this;
					}
				}
				++_edge_iterator;
				_node_iterator = _edge_iterator == _current->end() ? node_iterator()
				                                                   : _edge_iterator->second.begin();
				return *this;
			}

			auto operator++(int) -> iterator {
				auto i = *this;
				++*this;
				return i;
			}

			auto operator--() -> iterator& {
				if (_node_iterator == node_iterator()) {
					_edge_iterator = std::prev(_current->end());
					_node_iterator = std::prev(_edge_iterator->second.end());
					return *this;
				}

				if (_node_iterator != _edge_iterator->second.begin()) {
					--_node_iterator;
					return *this;
				}

				--_edge_iterator;
				_node_iterator = std::prev(_edge_iterator->second.end());
				return *this;
			}

			auto operator--(int) -> iterator {
				auto i = *this;
				--*this;
				return i;
			}

			// Iterator comparison
			auto operator==(iterator const& other) const -> bool = default;

		private:
			std::map<std::pair<N*, N*>, std::set<std::unique_ptr<E>>> const* _current = nullptr;
			edge_iterator _edge_iterator;
			node_iterator _node_iterator;
			friend class graph;

			explicit iterator(std::map<std::pair<N*, N*>, std::set<std::unique_ptr<E>>> const& current,
			                  edge_iterator edge_iter,
			                  node_iterator node_iter)
			: _current(&current)
			, _edge_iterator(edge_iter)
			, _node_iterator(node_iter) {}
		};

	private:
		std::set<std::unique_ptr<N>> _nodes;
		std::map<std::pair<N*, N*>, std::set<std::unique_ptr<E>>> _edges;

		// Helper to get the pointer to node
		auto get_node_pointer(N node) const -> N* {
			auto found =
			   std::find_if(_nodes.begin(), _nodes.end(), [node](auto& i) { return node == *i; });
			if (found == _nodes.end()) {
				return nullptr;
			}
			return (*found).get();
		}
	};
} // namespace gdwg

#endif // GDWG_GRAPH_HPP
