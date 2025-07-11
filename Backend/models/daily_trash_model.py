from datetime import date

class DailyTrash:
    def __init__(self, date, plastic=0, paper=0, cans=0, bottles=0, containers=0):
        self.date = date
        self.plastic = plastic
        self.paper = paper
        self.cans = cans
        self.bottles = bottles
        self.containers = containers
        
    def to_dict(self):
        return {
            "date": self.date,
            "plastic": self.plastic,
            "paper": self.paper,
            "cans": self.cans,
            "bottles": self.bottles,
            "containers": self.containers,
            "total": self.plastic + self.paper + self.cans + self.bottles + self.containers
        }
        
    def get_total(self):
        return self.plastic + self.paper + self.cans + self.bottles + self.containers