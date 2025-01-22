

class Record:
    def __init__(self, user_id, paper, plastic, cans, containers, bottles):
        self.user_id = user_id
        self.paper = paper
        self.plastic = plastic
        self.cans = cans
        self.containers = containers
        self.bottles = bottles
        
    def to_dict(self):
        return {
            "user_id": self.user_id,
            "paper": self.paper,
            "plastic": self.plastic,
            "cans": self.cans,
            "containers": self.containers,
            "bottles": self.bottles,
        }