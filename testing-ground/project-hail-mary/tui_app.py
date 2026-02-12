"""
Project Hail Mary - Textual TUI
Interactive dashboard with Rocky ASCII art.
"""

ROCKY_ASCII = r"""
        ___
      /  •  \
     | ROCKY |
      \_____/
    / |   | | \
   /  |   | |  \
"""

from textual.app import App, ComposeResult
from textual.widgets import Static, Footer, DataTable
from textual.reactive import reactive
from textual.binding import Binding

from check import fetch_movie_data, get_display_data


class RockyHeader(Static):
    """Rocky ASCII art and title."""

    def render(self) -> str:
        return f"""[bold blue]{ROCKY_ASCII}[/bold blue]
[bold]Project Hail Mary[/bold] — Biograf Spegeln
"""


class MovieData(Static):
    """Displays movie data in a table."""

    data = reactive(dict, init=False)

    def compose(self) -> ComposeResult:
        yield DataTable(id="movie-table")

    def on_mount(self) -> None:
        table = self.query_one("#movie-table", DataTable)
        table.add_columns("Field", "Value")
        table.cursor_type = "none"
        table.zebra_stripes = True

    def watch_data(self) -> None:
        self.update_table()

    def update_table(self) -> None:
        table = self.query_one("#movie-table", DataTable)
        table.clear(columns=True)
        table.add_columns("Field", "Value")
        if not self.data:
            table.add_row("—", "Loading...")
            return
        d = self.data
        table.add_row("Title", d.get("title", "—"))
        table.add_row("URL", d.get("url", "—"))
        table.add_row("Genre", d.get("genre", "—"))
        table.add_row("Duration", d.get("duration", "—"))
        table.add_row("Åldersgräns", d.get("age_rating", "—"))
        ticket = d.get("ticket_status", "—")
        if ticket in ("Biljetter", "Biljetter ute nu"):
            table.add_row("Ticket", f"[bold green]{ticket}[/bold green]")
        else:
            table.add_row("Ticket", f"[yellow]{ticket}[/yellow]")
        table.add_row("Premiär", d.get("premiere", "—"))


class PHMTui(App):
    """Project Hail Mary interactive TUI."""

    CSS = """
    RockyHeader {
        height: auto;
        padding: 1 0;
        text-align: center;
    }

    MovieData {
        height: auto;
        padding: 1 0;
    }

    #movie-table {
        width: 100%;
    }

    #status-bar {
        height: 1;
        padding: 0 1;
    }
    """

    BINDINGS = [
        Binding("r", "refresh", "Refresh"),
        Binding("+", "interval_up", "Interval +"),
        Binding("-", "interval_down", "Interval -"),
        Binding("m", "toggle_mode", "Auto/Manual"),
        Binding("q", "quit", "Quit"),
    ]

    interval = reactive(30)
    mode = reactive("auto")
    data = reactive(dict, init=False)
    error = reactive("", init=False)
    _timer = None

    def __init__(self, initial_interval: int = 30, **kwargs):
        super().__init__(**kwargs)
        self.interval = initial_interval

    def compose(self) -> ComposeResult:
        yield RockyHeader()
        yield MovieData(id="movie-data")
        yield Static(id="status-bar")
        yield Footer()

    def on_mount(self) -> None:
        self.refresh_data()
        self._start_auto_timer()
        self._update_footer()

    def _start_auto_timer(self) -> None:
        self._cancel_timer()
        if self.mode == "auto" and self.is_running:
            self._timer = self.set_interval(self.interval, self.refresh_data)

    def _cancel_timer(self) -> None:
        timer = getattr(self, "_timer", None)
        if timer is not None:
            timer.stop()
            self._timer = None

    def _update_footer(self) -> None:
        try:
            status = self.query_one("#status-bar", Static)
        except Exception:
            return
        mode_str = f"{self.mode} {self.interval}s" if self.mode == "auto" else "manual"
        status.update(f" [dim]{mode_str}[/dim] | r:refresh +/-:interval m:mode q:quit")

    def refresh_data(self) -> None:
        try:
            movie = fetch_movie_data()
            self.data = get_display_data(movie)
            self.error = ""
        except Exception as e:
            self.error = str(e)
            if not self.data:
                self.data = {"title": "Error", "ticket_status": str(e)}
        movie_widget = self.query_one("#movie-data", MovieData)
        movie_widget.data = self.data
        self._update_footer()

    def action_refresh(self) -> None:
        self.refresh_data()

    def action_interval_up(self) -> None:
        self.interval = min(60, self.interval + 5)
        if self.mode == "auto":
            self._start_auto_timer()
        self._update_footer()

    def action_interval_down(self) -> None:
        self.interval = max(5, self.interval - 5)
        if self.mode == "auto":
            self._start_auto_timer()
        self._update_footer()

    def action_toggle_mode(self) -> None:
        self.mode = "manual" if self.mode == "auto" else "auto"
        self._start_auto_timer()
        self._update_footer()

    def watch_interval(self) -> None:
        if not self._dom_ready:
            return
        if self.mode == "auto":
            self._start_auto_timer()
        self._update_footer()

    def watch_mode(self) -> None:
        if not self._dom_ready:
            return
        self._start_auto_timer()
        self._update_footer()


def run(initial_interval: int = 30) -> None:
    app = PHMTui(initial_interval=initial_interval)
    app.run()
