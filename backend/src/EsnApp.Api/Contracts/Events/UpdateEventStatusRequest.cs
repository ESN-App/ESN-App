using EsnApp.Domain.Events;

namespace EsnApp.Api.Contracts.Events;

public record UpdateEventStatusRequest(EventStatus Status);
